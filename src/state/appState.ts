import { signal, computed } from '@preact/signals';
import { Anime, PlayerState, StreamingPlatform, AuthUser, Category, Season } from '../types';
import { mockPlatforms } from '../data/content';
import { getPlatformData } from '../data/platformData';
import { mockLogin, mockRegister, mockGetCatalog, mockGetContentDetail, mockLoadContent, mockLoadEpisodes } from '../api/mockApi';

// === ESTADO GLOBAL ===
export const streamingPlatforms = signal(mockPlatforms);
export const currentPlatform = signal<StreamingPlatform | null>(mockPlatforms[0]);

export const categories = signal<Category[]>([]);
export const seasons = signal<Season[]>([]);
export const animeList = signal<Anime[]>([]);

export const currentAnime = signal<Anime | null>(null);
export const currentEpisode = signal(1);
export const authUser = signal<AuthUser | null>(null);
export const authSession = signal<any>(null);
export const catalogLoading = signal(false);
export const authLoading = signal(false);
export const isAuthenticated = computed(() => !!authUser.value && authUser.value.expiresAt > Date.now());

export const queue = signal<string[]>([]);
export const searchQuery = signal('');
export const activeCategory = signal<string>('all');
export const activeSeason = signal<string>('');
export const showSidebar = signal(false);
export const showQueue = signal(false);

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
export const searchResults = computed(() => {
  if (!searchQuery.value) return [];
  var q = searchQuery.value.toLowerCase();
  return animeList.value.filter(function(a) {
    return a.title.toLowerCase().indexOf(q) !== -1 ||
      (a.titleJapanese && a.titleJapanese.toLowerCase().indexOf(q) !== -1) ||
      a.synopsis.toLowerCase().indexOf(q) !== -1 ||
      a.genres.some(function(g) { return g.toLowerCase().indexOf(q) !== -1; });
  });
});

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
}

export function setActiveSeason(seasonId: string): void {
  activeSeason.value = seasonId;
}

export function setSearchQuery(query: string): void {
  searchQuery.value = query;
}

function applySession(platform: StreamingPlatform, session: any) {
  authSession.value = session;
  authUser.value = session.user;
  currentPlatform.value = platform;
  return session.user;
}

// === AUTH (CALLBACK-BASED) ===
export function authenticate(platform: StreamingPlatform, email: string, _password: string, callback: (user: AuthUser | null) => void): void {
  authLoading.value = true;

  if (!email) {
    authLoading.value = false;
    callback(null);
    return;
  }

  mockLogin(platform, { email: email, password: _password }, function(response) {
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

export function register(platform: StreamingPlatform, payload: { email: string; password: string; username: string }, callback: (user: AuthUser | null) => void): void {
  authLoading.value = true;

  if (!payload.email || !payload.username) {
    authLoading.value = false;
    callback(null);
    return;
  }

  mockRegister(platform, payload, function(response) {
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

// === CATALOG ===
export function loadPlatformCatalog(platform: StreamingPlatform, callback?: () => void): void {
  catalogLoading.value = true;

  mockGetCatalog(platform, function(response) {
    if ('error' in response) {
      catalogLoading.value = false;
      if (callback) callback();
      return;
    }

    var catalog = response.data;
    categories.value = catalog.categories;
    seasons.value = catalog.seasons;
    animeList.value = catalog.anime;
    currentPlatform.value = platform;

    catalogLoading.value = false;

    if (callback) callback();
  });
}

export function loadContent(platform: StreamingPlatform, _query?: any, callback?: (data: any) => void): void {
  mockLoadContent(platform, _query, function(response) {
    if ('error' in response) {
      if (callback) callback(null);
      return;
    }

    animeList.value = response.data;
    if (callback) {
      callback({ data: response.data });
    }
  });
}

export function loadContentDetail(platform: StreamingPlatform, contentId: string, callback: (data: any) => void): void {
  mockGetContentDetail(platform, contentId, function(response) {
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
  mockLoadEpisodes(platform, contentId, function(response) {
    if ('error' in response) {
      callback({ data: [] });
      return;
    }

    callback({ data: response.data });
  });
}

// === UTILS ===
export function logout(): void {
  authUser.value = null;
  authSession.value = null;
  currentPlatform.value = mockPlatforms[0];
  var defaultData = getPlatformData('crunchyroll');
  animeList.value = defaultData.anime;
  categories.value = defaultData.categories;
  seasons.value = defaultData.seasons;
  activeCategory.value = 'all';
}

export function selectPlatform(platform: StreamingPlatform): void {
  currentPlatform.value = platform;
  var data = getPlatformData(platform.id);
  animeList.value = data.anime;
  categories.value = data.categories;
  seasons.value = data.seasons;
  activeCategory.value = 'all';
  activeSeason.value = '';
}

// Inicializar con datos de Crunchyroll al cargar la app
selectPlatform(mockPlatforms[0]);
