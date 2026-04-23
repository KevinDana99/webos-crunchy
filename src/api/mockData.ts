import { Anime, Category, Season, StreamingPlatform } from '../types'
import { mockAnime, mockCategories, mockPlatforms, mockSeasons } from '../data/content'

const BASE_IMAGE = 'https://picsum.photos'
const STREAM_URL = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd'

function makeMovie(id: string, title: string, seed: string, year: number, rating: number, genres: string[]): Anime {
  return {
    id,
    title,
    synopsis: `${title} disponible como pelicula dentro del catalogo mock. Esta respuesta simula el detalle resumido que enviaria una API de streaming.`,
    image: `${BASE_IMAGE}/seed/${seed}/400/600`,
    year,
    episodes: 1,
    status: 'completed',
    rating,
    genres,
    studios: ['Aion Mock Studio'],
    season: `${year}`,
    streamUrl: STREAM_URL,
    episodesList: [
      {
        number: 1,
        title,
        description: `Reproduccion completa de ${title}.`,
        thumbnail: `${BASE_IMAGE}/seed/${seed}-movie/320/180`,
        duration: 96,
        airedDate: `${year}-01-01`
      }
    ]
  }
}

function cloneContentForPlatform(platformId: string, offset: number) {
  const platformAnime = mockAnime.map((item, index) => ({
    ...item,
    id: `${platformId}-${item.id}`,
    rating: Math.max(70, Math.min(99, item.rating - offset + (index % 3))),
    streamUrl: STREAM_URL
  }))

  const movies = [
    makeMovie(`${platformId}-movie-1`, 'Aion: First Contact', `${platformId}-movie-a`, 2024, 91 - offset, ['Sci-Fi', 'Drama']),
    makeMovie(`${platformId}-movie-2`, 'Midnight Signal', `${platformId}-movie-b`, 2022, 84 - offset, ['Thriller', 'Mystery']),
    makeMovie(`${platformId}-movie-3`, 'Summer Orbit', `${platformId}-movie-c`, 2021, 88 - offset, ['Adventure', 'Comedy'])
  ]

  return [...platformAnime, ...movies]
}

export interface MockAccount {
  email: string
  password: string
  username: string
  avatar?: string
}

export interface PlatformMockData {
  platform: StreamingPlatform
  accounts: MockAccount[]
  categories: Category[]
  seasons: Season[]
  content: Anime[]
}

export const platformMockData: Record<string, PlatformMockData> = mockPlatforms.reduce(
  (acc, platform, index) => {
    acc[platform.id] = {
      platform,
      accounts: [
        {
          email: 'demo@aion.tv',
          password: 'demo1234',
          username: `demo_${platform.id}`,
          avatar: `${BASE_IMAGE}/seed/${platform.id}-avatar/120/120`
        },
        {
          email: `${platform.id}@aion.tv`,
          password: 'password',
          username: platform.id,
          avatar: `${BASE_IMAGE}/seed/${platform.id}-user/120/120`
        }
      ],
      categories: mockCategories,
      seasons: mockSeasons,
      content: cloneContentForPlatform(platform.id, index)
    }

    return acc
  },
  {} as Record<string, PlatformMockData>
)

export function getPlatformData(platformId: string) {
  return platformMockData[platformId]
}
