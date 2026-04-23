import { Anime, Episode } from '../types'
import {
  ApiResponse,
  AuthSession,
  ContentDetail,
  ContentQuery,
  LoginRequest,
  PaginatedApiResponse,
  PlatformCatalog,
  RegisterRequest
} from '../types/api'
import { apiClient } from './client'

function params(query?: ContentQuery) {
  return {
    kind: query?.kind,
    categoryId: query?.categoryId,
    seasonId: query?.seasonId,
    search: query?.search,
    page: query?.page,
    pageSize: query?.pageSize
  }
}

export const streamingApi = {
  async login(platformId: string, payload: LoginRequest) {
    const response = await apiClient.post<ApiResponse<AuthSession>>(`/${platformId}/auth`, payload)
    return response.data
  },

  async register(platformId: string, payload: RegisterRequest) {
    const response = await apiClient.post<ApiResponse<AuthSession>>(`/${platformId}/register`, payload)
    return response.data
  },

  async refreshToken(platformId: string, refreshToken: string) {
    const response = await apiClient.post<ApiResponse<AuthSession>>(`/${platformId}/token`, {
      refreshToken
    })
    return response.data
  },

  async getCatalog(platformId: string) {
    const response = await apiClient.get<ApiResponse<PlatformCatalog>>(`/${platformId}/catalog`)
    return response.data
  },

  async getContent(platformId: string, query?: ContentQuery) {
    const response = await apiClient.get<PaginatedApiResponse<Anime>>(`/${platformId}/content`, {
      params: params(query)
    })
    return response.data
  },

  async getMovies(platformId: string, query?: ContentQuery) {
    return this.getContent(platformId, {
      ...query,
      kind: 'movie'
    })
  },

  async getSeries(platformId: string, query?: ContentQuery) {
    return this.getContent(platformId, {
      ...query,
      kind: 'series'
    })
  },

  async getContentDetail(platformId: string, contentId: string) {
    const response = await apiClient.get<ApiResponse<ContentDetail>>(`/${platformId}/content/${contentId}`)
    return response.data
  },

  async getEpisodes(platformId: string, contentId: string) {
    const response = await apiClient.get<ApiResponse<Episode[]>>(`/${platformId}/content/${contentId}/episodes`)
    return response.data
  }
}
