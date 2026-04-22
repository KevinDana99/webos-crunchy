export interface Anime {
  id: string;
  title: string;
  titleJapanese?: string;
  synopsis: string;
  image: string;
  year: number;
  episodes: number;
  status: 'completed' | 'ongoing' | 'upcoming';
  rating: number;
  genres: string[];
  studios: string[];
  episodesList?: Episode[];
  season?: string;
  streamUrl: string;
}

export interface Episode {
  number: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  airedDate: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
}

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  buffered: number;
  fullscreen: boolean;
  quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  subtitle?: string;
}