import { Anime, AnimeSeason, AuthUser, Category, Season, StreamingPlatform } from '../types'

export type ContentKind = 'movie' | 'series'

export interface ApiMeta {
  requestId: string
  platform: string
  timestamp: string
}

export interface ApiPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  meta: ApiMeta
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: ApiPagination
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    status: number
  }
  meta: ApiMeta
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  username: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface PlatformCatalog {
  platform: StreamingPlatform
  anime: Anime[]
  categories: Category[]
  seasons: Season[]
  featured: Anime[]
  continueWatching: Anime[]
}

export interface PagedContentResult {
  platform: PlatformCatalog
  page: number
  limit: number
  total: number
}

export interface ContentQuery {
  platformId?: string
  kind?: ContentKind
  categoryId?: string
  seasonId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface ContentDetail {
  item: Anime
  seasons: AnimeSeason[]
  related: Anime[]
}
