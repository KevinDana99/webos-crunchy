import { signal, computed } from '@preact/signals';
import { Anime, PlayerState, StreamingPlatform, AuthUser } from '../types';
import { mockAnime, mockCategories, mockSeasons, searchAnime, mockPlatforms } from '../data/content';
import { streamingApi } from '../api/streamingApi';
import { AuthSession, ContentQuery, RegisterRequest } from '../types/api';

export const animeList = signal(mockAnime);
export const categories = signal(mockCategories);
export const seasons = signal(mockSeasons);
export const streamingPlatforms = signal(mockPlatforms);

export const currentAnime = signal<Anime | null>(null);
export const currentEpisode = signal(1);
export const currentPlatform = signal<StreamingPlatform | null>(mockPlatforms[0]);
export const authUser = signal<AuthUser | null>(null);
export const authSession = signal<AuthSession | null>(null);
export const catalogLoading = signal(false);
export const authLoading = signal(false);
export const isAuthenticated = computed(() => !!authUser.value && authUser.value.expiresAt > Date.now());

export const queue = signal<string[]>([]);
export const searchQuery = signal('');
export const activeCategory = signal<string>('trending');
export const activeSeason = signal<string>('spring-2024');
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

export const searchResults = computed(() => {
  if (!searchQuery.value) return [];
  return searchAnime(searchQuery.value);
});

export const filteredAnime = computed(() => {
  const categoryId = activeCategory.value;
  if (categoryId === 'all') return animeList.value;
  if (categoryId === 'trending') return [...animeList.value].sort((a, b) => b.rating - a.rating).slice(0, 6);
  if (categoryId === 'popular') return [...animeList.value].sort((a, b) => b.episodes - a.episodes).slice(0, 6);
  if (categoryId === 'new') return animeList.value.filter((a) => a.status === 'ongoing').slice(0, 6);
  if (categoryId === 'simulcast') return animeList.value.filter((a) => a.year >= 2023).slice(0, 6);
  return animeList.value.filter((a) => a.genres.some((g) => g.toLowerCase() === categoryId.toLowerCase()));
});

export const featuredAnime = computed(() => animeList.value[0]);

export const isInQueue = computed(() => (id: string) => queue.value.includes(id));

export function toggleQueue(id: string) {
  const current = queue.value;
  if (current.includes(id)) {
    queue.value = current.filter((f) => f !== id);
  } else {
    queue.value = [...current, id];
  }
}

export function playAnime(anime: Anime, episode: number = 1) {
  currentAnime.value = anime;
  currentEpisode.value = episode;
  playerState.value = {
    ...playerState.value,
    playing: true,
    currentTime: 0,
    duration: (anime.episodesList?.[episode - 1]?.duration || 24) * 60,
  };
}

export function selectAnime(anime: Anime) {
  currentAnime.value = anime;
  currentEpisode.value = 1;
}

export function setActiveCategory(categoryId: string) {
  activeCategory.value = categoryId;
}

export function setActiveSeason(seasonId: string) {
  activeSeason.value = seasonId;
}

export function setSearchQuery(query: string) {
  searchQuery.value = query;
}

function applySession(platform: StreamingPlatform, session: AuthSession) {
  authSession.value = session;
  authUser.value = session.user;
  currentPlatform.value = platform;
  return session.user;
}

export async function authenticate(platform: StreamingPlatform, email: string, password: string): Promise<AuthUser | null> {
  authLoading.value = true;

  try {
    const response = await streamingApi.login(platform.id, { email, password });
    return applySession(platform, response.data);
  } finally {
    authLoading.value = false;
  }
}

export async function register(platform: StreamingPlatform, payload: RegisterRequest): Promise<AuthUser | null> {
  authLoading.value = true;

  try {
    const response = await streamingApi.register(platform.id, payload);
    return applySession(platform, response.data);
  } finally {
    authLoading.value = false;
  }
}

export async function loadPlatformCatalog(platform: StreamingPlatform = currentPlatform.value || mockPlatforms[0]) {
  catalogLoading.value = true;

  try {
    const response = await streamingApi.getCatalog(platform.id);
    streamingPlatforms.value = mockPlatforms;
    categories.value = response.data.categories;
    seasons.value = response.data.seasons;
    currentPlatform.value = response.data.platform;
    return response.data;
  } finally {
    catalogLoading.value = false;
  }
}

export async function loadContent(platform: StreamingPlatform = currentPlatform.value || mockPlatforms[0], query?: ContentQuery) {
  const response = await streamingApi.getContent(platform.id, query);
  animeList.value = response.data;
  return response;
}

export async function loadMovies(platform: StreamingPlatform = currentPlatform.value || mockPlatforms[0], query?: ContentQuery) {
  return streamingApi.getMovies(platform.id, query);
}

export async function loadSeries(platform: StreamingPlatform = currentPlatform.value || mockPlatforms[0], query?: ContentQuery) {
  return streamingApi.getSeries(platform.id, query);
}

export async function loadContentDetail(platform: StreamingPlatform, contentId: string) {
  return streamingApi.getContentDetail(platform.id, contentId);
}

export async function loadEpisodes(platform: StreamingPlatform, contentId: string) {
  return streamingApi.getEpisodes(platform.id, contentId);
}

export function logout() {
  authUser.value = null;
  authSession.value = null;
  currentPlatform.value = mockPlatforms[0];
}

export function selectPlatform(platform: StreamingPlatform) {
  currentPlatform.value = platform;
}
