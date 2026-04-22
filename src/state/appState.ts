import { signal, computed } from '@preact/signals';
import { Anime, PlayerState } from '../types';
import { mockAnime, mockCategories, mockSeasons, searchAnime } from '../data/content';

export const animeList = signal(mockAnime);
export const categories = signal(mockCategories);
export const seasons = signal(mockSeasons);

export const currentAnime = signal<Anime | null>(null);
export const currentEpisode = signal(1);
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

export function setActiveCategory(categoryId: string) {
  activeCategory.value = categoryId;
}

export function setActiveSeason(seasonId: string) {
  activeSeason.value = seasonId;
}

export function setSearchQuery(query: string) {
  searchQuery.value = query;
}