import { signal, computed } from '@preact/signals';
import { Anime, PlayerState, StreamingPlatform, AuthUser, Category, Season } from '../types';
import { mockPlatforms } from '../data/content';
import { backendLogin, backendBootstrapSession, backendRefreshSession, backendGetCatalog, backendGetContentDetail, backendLoadContent, backendLoadEpisodes, clearCatalogCache, clearStreamCache } from '../api/backendApi';

// === ESTADO GLOBAL ===
export const streamingPlatforms = signal(mockPlatforms);
export const currentPlatform = signal<StreamingPlatform | null>(mockPlatforms[0]);

export const categories = signal<Category[]>([]);
export const seasons = signal<Season[]>([]);
export const animeList = signal<Anime[]>([]);

export const currentAnime = signal<Anime | null>(null);
export const currentEpisode = signal(1);
export const currentPlaybackUrl = signal('');
export const authUser = signal<AuthUser | null>(null);
export const authSession = signal<any>(null);
export const catalogLoading = signal(false);
export const authLoading = signal(false);
export const bootstrapLoading = signal(false);
export const isAuthenticated = computed(() => !!authUser.value && authUser.value.expiresAt > Date.now());

export const queue = signal<string[]>([]);
export const searchQuery = signal('');
export const activeCategory = signal<string>('all');
export const activeSeason = signal<string>('');
export const currentPage = signal(1);
export const pageSize = signal(20);
export const totalItems = signal(0);
export const showSidebar = signal(false);
export const showQueue = signal(false);

let refreshTimer: number | null = null;
let refreshInFlight = false;
let refreshQueue: Array<(success: boolean) => void> = [];

export const playerState = signal<PlayerState>({
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  muted: false,
  buffered: 0,
  fullscreen: false,
  quality: 'auto',
});

// === COMPUTED ===
export const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalItems.value / pageSize.value));
});

export const searchResults = computed(() => animeList.value);

export const filteredAnime = computed(() => {
  var categoryId = activeCategory.value;
  if (categoryId === 'all') return animeList.value;
  if (categoryId === 'trending') return animeList.value.slice().sort(function(a, b) { return b.rating - a.rating; }).slice(0, 6);
  if (categoryId === 'popular') return animeList.value.slice().sort(function(a, b) { return b.episodes - a.episodes; }).slice(0, 6);
  if (categoryId === 'new') return animeList.value.filter(function(a) { return a.status === 'ongoing'; }).slice(0, 6);
  if (categoryId === 'simulcast') return animeList.value.filter(function(a) { return a.year >= 2023; }).slice(0, 6);
  return animeList.value.filter(function(a) { return a.genres.some(function(g) { return g.toLowerCase() === categoryId.toLowerCase(); }); });
});

export const featuredAnime = computed(() => animeList.value[0]);

export function isInQueue(id: string): boolean {
  return queue.value.indexOf(id) !== -1;
}

// === ACCIONES ===
export function toggleQueue(id: string): void {
  var current = queue.value;
  if (current.indexOf(id) !== -1) {
    queue.value = current.filter(function(f) { return f !== id; });
  } else {
    queue.value = current.concat([id]);
  }
}

export function playAnime(anime: Anime, episode?: number): void {
  var ep = episode || 1;
  currentAnime.value = anime;
  currentEpisode.value = ep;
  currentPlaybackUrl.value = '';
  playerState.value = {
    ...playerState.value,
    playing: false,
    currentTime: 0,
    duration: ((anime.episodesList && anime.episodesList[ep - 1] && anime.episodesList[ep - 1].duration) || 24) * 60,
  };
}

export function selectAnime(anime: Anime): void {
  currentAnime.value = anime;
  currentEpisode.value = 1;
}

export function setActiveCategory(categoryId: string): void {
  activeCategory.value = categoryId;
  currentPage.value = 1;
}

export function setActiveSeason(seasonId: string): void {
  activeSeason.value = seasonId;
  currentPage.value = 1;
}

export function setSearchQuery(query: string): void {
  searchQuery.value = query;
  currentPage.value = 1;

  if (isAuthenticated.value && currentPlatform.value) {
    loadCurrentPage(1);
  }
}

function applySession(platform: StreamingPlatform, session: any) {
  authSession.value = session;
  authUser.value = session.user;
  currentPlatform.value = platform;
  scheduleSessionRefresh(platform, session);
  return session.user;
}

function clearRefreshTimer(): void {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleSessionRefresh(platform: StreamingPlatform, session: any): void {
  clearRefreshTimer();

  if (!session || !session.refreshToken || platform.id !== 'crunchyroll' || !session.user) {
    return;
  }

  const msUntilRefresh = session.user.expiresAt - Date.now() - 60 * 1000;
  const delay = Math.max(5 * 1000, msUntilRefresh);

  refreshTimer = window.setTimeout(function onRefreshTimer() {
    refreshAuthSession(function noop() {}, platform);
  }, delay);
}

function flushRefreshQueue(success: boolean): void {
  const queued = refreshQueue.slice();
  refreshQueue = [];

  for (let i = 0; i < queued.length; i += 1) {
    queued[i](success);
  }
}

export function refreshAuthSession(callback?: (success: boolean) => void, forcedPlatform?: StreamingPlatform | null): void {
  const platform = forcedPlatform || currentPlatform.value;
  const session = authSession.value;

  if (!platform || !session || !session.refreshToken || platform.id !== 'crunchyroll') {
    if (callback) callback(false);
    return;
  }

  if (refreshInFlight) {
    if (callback) refreshQueue.push(callback);
    return;
  }

  refreshInFlight = true;
  if (callback) refreshQueue.push(callback);

  backendRefreshSession(platform, session.refreshToken, function(response) {
    refreshInFlight = false;

    if ('error' in response) {
      clearRefreshTimer();
      flushRefreshQueue(false);
      return;
    }

    const currentSession = authSession.value;
    const refreshedSession = {
      ...response.data,
      refreshToken: response.data.refreshToken || (currentSession ? currentSession.refreshToken : ''),
      user: {
        ...response.data.user,
        email: response.data.user.email || (currentSession && currentSession.user ? currentSession.user.email : ''),
        username: response.data.user.username || (currentSession && currentSession.user ? currentSession.user.username : platform.name),
        avatar: response.data.user.avatar || (currentSession && currentSession.user ? currentSession.user.avatar : undefined),
      },
    };

    applySession(platform, refreshedSession);
    clearCatalogCache();
    clearStreamCache();
    flushRefreshQueue(true);
  });
}

export function ensureFreshSession(callback: (success: boolean) => void): void {
  const platform = currentPlatform.value;
  const session = authSession.value;

  if (!platform || !session || platform.id !== 'crunchyroll' || !session.refreshToken) {
    callback(true);
    return;
  }

  const expiresAt = session.user && session.user.expiresAt ? session.user.expiresAt : 0;
  if (expiresAt - Date.now() > 60 * 1000) {
    callback(true);
    return;
  }

  refreshAuthSession(callback, platform);
}

function withSessionRetry(
  action: (done: (response: any) => void) => void,
  callback?: (response: any) => void
): void {
  ensureFreshSession(function(_ready) {
    action(function(response) {
      if (response && response.error && response.error.status === 401) {
        refreshAuthSession(function(success) {
          if (!success) {
            if (callback) callback(response);
            return;
          }

          action(function(retriedResponse) {
            if (callback) callback(retriedResponse);
          });
        });
        return;
      }

      if (callback) callback(response);
    });
  });
}

// === AUTH (CALLBACK-BASED) ===
export function authenticate(platform: StreamingPlatform, email: string, _password: string, callback: (user: AuthUser | null) => void): void {
  authLoading.value = true;

  if (!email) {
    authLoading.value = false;
    callback(null);
    return;
  }

  backendLogin(platform, { email: email, password: _password }, function(response) {
    if ('error' in response) {
      authLoading.value = false;
      callback(null);
      return;
    }

    var session = response.data;
    applySession(platform, session);
    authLoading.value = false;

    // Cargar catálogo y notificar cuando termine
    loadPlatformCatalog(platform, function() {
      callback(session.user);
    });
  });
}

export function bootstrapAuthentication(platform: StreamingPlatform, callback: (user: AuthUser | null) => void): void {
  bootstrapLoading.value = true;

  backendBootstrapSession(platform, function(response) {
    bootstrapLoading.value = false;

    if ('error' in response) {
      callback(null);
      return;
    }

    const session = response.data;
    applySession(platform, session);

    loadPlatformCatalog(platform, function() {
      callback(session.user);
    });
  });
}

// === CATALOG ===
export function loadPlatformCatalog(platform: StreamingPlatform, callback?: () => void): void {
  catalogLoading.value = true;

  withSessionRetry(function(done) {
    backendGetCatalog(
      platform,
      authSession.value ? authSession.value.accessToken : undefined,
      currentPage.value,
      pageSize.value,
      done
    );
  }, function(response) {
    if ('error' in response) {
      catalogLoading.value = false;
      if (callback) callback();
      return;
    }

    var catalog = response.data;
    categories.value = catalog.platform.categories;
    seasons.value = catalog.platform.seasons;
    animeList.value = catalog.platform.anime;
    currentPage.value = catalog.page;
    totalItems.value = catalog.total;
    currentPlatform.value = platform;

    catalogLoading.value = false;

    if (callback) callback();
  });
}

export function loadContent(platform: StreamingPlatform, _query?: any, callback?: (data: any) => void): void {
  withSessionRetry(function(done) {
    backendLoadContent(
      platform,
      authSession.value ? authSession.value.accessToken : undefined,
      {
        search: _query && _query.search ? _query.search : searchQuery.value,
        page: currentPage.value,
        limit: pageSize.value,
      },
      done
    );
  }, function(response) {
    if ('error' in response) {
      if (callback) callback(null);
      return;
    }

    animeList.value = response.data.platform.anime;
    categories.value = response.data.platform.categories;
    seasons.value = response.data.platform.seasons;
    currentPage.value = response.data.page;
    totalItems.value = response.data.total;
    if (callback) {
      callback({ data: response.data.platform.anime });
    }
  });
}

export function loadContentDetail(platform: StreamingPlatform, contentId: string, callback: (data: any) => void): void {
  withSessionRetry(function(done) {
    backendGetContentDetail(platform, authSession.value ? authSession.value.accessToken : undefined, contentId, done);
  }, function(response) {
    if ('error' in response) {
      callback(null);
      return;
    }

    var detail = response.data;
    callback({
      item: detail.item,
      seasons: detail.seasons,
      related: detail.related
    });
  });
}

export function loadEpisodes(platform: StreamingPlatform, contentId: string, callback: (data: any) => void): void {
  withSessionRetry(function(done) {
    backendLoadEpisodes(platform, authSession.value ? authSession.value.accessToken : undefined, contentId, done);
  }, function(response) {
    if ('error' in response) {
      callback({ data: [] });
      return;
    }

    callback({ data: response.data });
  });
}

// === UTILS ===
export function logout(): void {
  clearRefreshTimer();
  authUser.value = null;
  authSession.value = null;
  bootstrapLoading.value = false;
  currentPlatform.value = mockPlatforms[0];
  currentPlaybackUrl.value = '';
  currentPage.value = 1;
  totalItems.value = 0;
  animeList.value = [];
  categories.value = [];
  seasons.value = [];
  activeCategory.value = 'all';
  activeSeason.value = '';
  clearCatalogCache();
  clearStreamCache();
}

export function selectPlatform(platform: StreamingPlatform): void {
  currentPlatform.value = platform;
  activeCategory.value = 'all';
  activeSeason.value = '';

  if (isAuthenticated.value) {
    loadCurrentPage(1);
  }
}

export function loadCurrentPage(page?: number): void {
  const platform = currentPlatform.value;
  if (!platform) return;

  currentPage.value = page || currentPage.value;

  if (searchQuery.value) {
    loadContent(platform, { search: searchQuery.value });
    return;
  }

  loadPlatformCatalog(platform);
}

export function goToPage(page: number): void {
  const safePage = Math.max(1, Math.min(page, totalPages.value));
  loadCurrentPage(safePage);
}

export function nextPage(): void {
  if (currentPage.value >= totalPages.value) return;
  goToPage(currentPage.value + 1);
}

export function previousPage(): void {
  if (currentPage.value <= 1) return;
  goToPage(currentPage.value - 1);
}

// Inicializar con datos de Crunchyroll al cargar la app
selectPlatform(mockPlatforms[0]);
