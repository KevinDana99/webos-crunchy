import { AuthUser, StreamingPlatform, Anime } from '../types'
import {
  ApiErrorResponse,
  ApiResponse,
  AuthSession,
  ContentDetail,
  LoginRequest,
  PlatformCatalog,
  PagedContentResult,
} from '../types/api'

type BackendEnvelope<T> = {
  status: number
  data?: T
  error?: {
    message?: string
  }
}

type MoviesListPayload = {
  items: Anime[]
  categories: PlatformCatalog['categories']
  seasons: PlatformCatalog['seasons']
  featured: Anime[]
  continueWatching: Anime[]
  platform: string
  page: number
  limit: number
  total: number
}

type StreamPayload = {
  outputUrl: string
  platform?: string
  path?: string
  quality?: string
  codec?: string
  compatible?: string[]
}

type LocalAuthPayload = {
  user: {
    id: string
    email: string
    username: string
    avatar?: string
  }
  token: string
}

type PlatformAuthPayload = {
  platform: string
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  account_id?: string
  country?: string
  obtained_at?: number
  user?: {
    account_id?: string
    username?: string | null
    email?: string | null
    avatar?: string | null
  }
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:3001/api/v1'

const catalogCache: Record<string, PagedContentResult> = {}
const streamCache: Record<string, string> = {}

function getBackendOrigin(): string {
  const apiIndex = API_BASE_URL.indexOf('/api/')
  if (apiIndex !== -1) {
    return API_BASE_URL.slice(0, apiIndex)
  }

  return API_BASE_URL
}

function toAbsoluteBackendUrl(url: string): string {
  if (!url) return url
  if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
    return url
  }

  if (url.charAt(0) === '/') {
    return getBackendOrigin() + url
  }

  return getBackendOrigin() + '/' + url
}

function createMeta(platformId: string) {
  return {
    requestId: `${platformId}_${Date.now()}`,
    platform: platformId,
    timestamp: new Date().toISOString(),
  }
}

function createErrorResponse(
  platformId: string,
  status: number,
  message: string
): ApiErrorResponse {
  return {
    error: {
      code: status === 0 ? 'NETWORK_ERROR' : 'API_ERROR',
      message,
      status,
    },
    meta: createMeta(platformId),
  }
}

function isApiErrorResponse(
  response: BackendEnvelope<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return 'meta' in response && 'error' in response
}

function request<T>(
  method: 'GET' | 'POST',
  path: string,
  platformId: string,
  body: unknown,
  headers: Record<string, string> | null,
  callback: (response: BackendEnvelope<T> | ApiErrorResponse) => void
): void {
  const xhr = new XMLHttpRequest()
  xhr.open(method, API_BASE_URL + path, true)
  xhr.setRequestHeader('Accept', 'application/json')

  if (body !== null && body !== undefined) {
    xhr.setRequestHeader('Content-Type', 'application/json')
  }

  if (headers) {
    const headerKeys = Object.keys(headers)
    for (let i = 0; i < headerKeys.length; i += 1) {
      xhr.setRequestHeader(headerKeys[i], headers[headerKeys[i]])
    }
  }

  xhr.onreadystatechange = function onReadyStateChange() {
    if (xhr.readyState !== 4) return

    let parsed: BackendEnvelope<T> | null = null

    try {
      parsed = xhr.responseText
        ? (JSON.parse(xhr.responseText) as BackendEnvelope<T>)
        : null
    } catch (_parseError) {
      callback(
        createErrorResponse(
          platformId,
          xhr.status || 500,
          'Invalid JSON response from backend'
        )
      )
      return
    }

    if (xhr.status >= 200 && xhr.status < 300 && parsed) {
      callback(parsed)
      return
    }

    callback(
      createErrorResponse(
        platformId,
        xhr.status || 500,
        (parsed && parsed.error && parsed.error.message) ||
          xhr.statusText ||
          'Request failed'
      )
    )
  }

  xhr.onerror = function onError() {
    callback(createErrorResponse(platformId, 0, 'Network error'))
  }

  xhr.send(body !== null && body !== undefined ? JSON.stringify(body) : null)
}

function mapAuthUser(
  platform: StreamingPlatform,
  user: {
    id: string
    email: string
    username: string
    avatar?: string
  },
  token: string
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    platform: platform.id,
    token,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
}

function mapAuthSession(
  platform: StreamingPlatform,
  payload: LocalAuthPayload
): AuthSession {
  return {
    user: mapAuthUser(platform, payload.user, payload.token),
    accessToken: payload.token,
    refreshToken: '',
    tokenType: 'Bearer',
    expiresIn: 7 * 24 * 60 * 60,
  }
}

function mapPlatformAuthSession(
  platform: StreamingPlatform,
  credentials: LoginRequest,
  payload: PlatformAuthPayload
): AuthSession {
  const profile = payload.user || {}
  const email = profile.email || credentials.email
  const username =
    profile.username || email.split('@')[0] || platform.name || platform.id
  const userId = profile.account_id || payload.account_id || email
  const expiresInMs = (payload.expires_in || 7200) * 1000

  return {
    user: {
      id: userId,
      email,
      username,
      avatar: profile.avatar || undefined,
      platform: platform.id,
      token: payload.access_token,
      expiresAt: Date.now() + expiresInMs,
    },
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || '',
    tokenType:
      payload.token_type === 'Bearer' ? 'Bearer' : 'Bearer',
    expiresIn: payload.expires_in || 7200,
  }
}

function mapCatalog(
  platform: StreamingPlatform,
  payload: MoviesListPayload
): PagedContentResult {
  return {
    platform: {
      platform,
      anime: payload.items,
      categories: payload.categories,
      seasons: payload.seasons,
      featured: payload.featured,
      continueWatching: payload.continueWatching,
    },
    page: payload.page,
    limit: payload.limit,
    total: payload.total,
  }
}

function withCatalog(
  platform: StreamingPlatform,
  accessToken: string | undefined,
  page: number,
  limit: number,
  callback: (response: ApiResponse<PagedContentResult> | ApiErrorResponse) => void
): void {
  const cacheKey = `${platform.id}:${page}:${limit}`
  const cachedCatalog = catalogCache[cacheKey]
  if (cachedCatalog) {
    callback({
      data: cachedCatalog,
      meta: createMeta(platform.id),
    })
    return
  }

  request<MoviesListPayload>(
    'POST',
    '/movies/list',
    platform.id,
    { platform: platform.id, page, limit },
    accessToken ? { Authorization: 'Bearer ' + accessToken } : null,
    function onCatalog(response) {
      if (isApiErrorResponse(response)) {
        callback(response)
        return
      }

      if (!response.data) {
        callback(createErrorResponse(platform.id, 500, 'Missing catalog data'))
        return
      }

      const catalog = mapCatalog(platform, response.data)
      catalogCache[cacheKey] = catalog
      callback({
        data: catalog,
        meta: createMeta(platform.id),
      })
    }
  )
}

export function backendLogin(
  platform: StreamingPlatform,
  credentials: LoginRequest,
  callback: (response: ApiResponse<AuthSession> | ApiErrorResponse) => void
): void {
  const isCrunchyrollPlatformLogin = platform.id === 'crunchyroll'
  const path = isCrunchyrollPlatformLogin
    ? '/auth/crunchyroll/login'
    : '/auth/login'

  request<LocalAuthPayload | PlatformAuthPayload>(
    'POST',
    path,
    platform.id,
    credentials,
    null,
    function onLogin(response) {
      if (isApiErrorResponse(response)) {
        callback(response)
        return
      }

      if (!response.data) {
        callback(createErrorResponse(platform.id, 500, 'Missing auth data'))
        return
      }

      callback({
        data: isCrunchyrollPlatformLogin
          ? mapPlatformAuthSession(
              platform,
              credentials,
              response.data as PlatformAuthPayload
            )
          : mapAuthSession(platform, response.data as LocalAuthPayload),
        meta: createMeta(platform.id),
      })
    }
  )
}

export function backendRefreshSession(
  platform: StreamingPlatform,
  refreshToken: string,
  callback: (response: ApiResponse<AuthSession> | ApiErrorResponse) => void
): void {
  request<PlatformAuthPayload>(
    'POST',
    '/auth/' + platform.id + '/refresh',
    platform.id,
    { refresh_token: refreshToken },
    null,
    function onRefresh(response) {
      if (isApiErrorResponse(response)) {
        callback(response)
        return
      }

      if (!response.data) {
        callback(createErrorResponse(platform.id, 500, 'Missing refresh data'))
        return
      }

      callback({
        data: mapPlatformAuthSession(
          platform,
          { email: '', password: '' },
          response.data
        ),
        meta: createMeta(platform.id),
      })
    }
  )
}

export function backendBootstrapSession(
  platform: StreamingPlatform,
  callback: (response: ApiResponse<AuthSession> | ApiErrorResponse) => void
): void {
  request<PlatformAuthPayload>(
    'GET',
    '/auth/' + platform.id + '/bootstrap',
    platform.id,
    null,
    null,
    function onBootstrap(response) {
      if (isApiErrorResponse(response)) {
        callback(response)
        return
      }

      if (!response.data) {
        callback(createErrorResponse(platform.id, 500, 'Missing bootstrap data'))
        return
      }

      callback({
        data: mapPlatformAuthSession(
          platform,
          { email: '', password: '' },
          response.data
        ),
        meta: createMeta(platform.id),
      })
    }
  )
}

export function backendGetCatalog(
  platform: StreamingPlatform,
  accessToken: string | undefined,
  page: number,
  limit: number,
  callback: (response: ApiResponse<PagedContentResult> | ApiErrorResponse) => void
): void {
  withCatalog(platform, accessToken, page, limit, callback)
}

export function backendLoadContent(
  platform: StreamingPlatform,
  accessToken: string | undefined,
  query: { search?: string; page: number; limit: number } | undefined,
  callback?: (response: ApiResponse<PagedContentResult> | ApiErrorResponse) => void
): void {
  if (!callback) return

  const page = query && query.page ? query.page : 1
  const limit = query && query.limit ? query.limit : 20
  const search = query && query.search ? query.search : ''

  if (!search) {
    withCatalog(platform, accessToken, page, limit, callback)
    return
  }

  request<MoviesListPayload>(
    'POST',
    '/movies/search',
    platform.id,
    { platform: platform.id, q: search, page, limit },
    accessToken ? { Authorization: 'Bearer ' + accessToken } : null,
    function onSearch(response) {
      if (isApiErrorResponse(response)) {
        callback(response)
        return
      }

      if (!response.data) {
        callback(createErrorResponse(platform.id, 500, 'Missing search data'))
        return
      }

      callback({
        data: mapCatalog(platform, response.data),
        meta: createMeta(platform.id),
      })
    }
  )
}

export function backendGetContentDetail(
  platform: StreamingPlatform,
  accessToken: string | undefined,
  contentId: string,
  callback: (response: ApiResponse<ContentDetail> | ApiErrorResponse) => void
): void {
  withCatalog(platform, accessToken, 1, 100, function onCatalog(response) {
    if ('error' in response) {
      callback(response)
      return
    }

    const item = response.data.platform.anime.find(function findAnime(anime) {
      return anime.id === contentId
    })

    if (!item) {
      callback(createErrorResponse(platform.id, 404, 'Content not found'))
      return
    }

    callback({
      data: {
        item,
        seasons: item.seasons || [],
        related: response.data.platform.anime
          .filter(function filterAnime(anime) {
            return anime.id !== contentId
          })
          .slice(0, 4),
      },
      meta: createMeta(platform.id),
    })
  })
}

export function backendLoadEpisodes(
  platform: StreamingPlatform,
  accessToken: string | undefined,
  contentId: string,
  callback?: (response: ApiResponse<any[]> | ApiErrorResponse) => void
): void {
  withCatalog(platform, accessToken, 1, 100, function onCatalog(response) {
    if (!callback) return

    if ('error' in response) {
      callback(response)
      return
    }

    const item = response.data.platform.anime.find(function findAnime(anime) {
      return anime.id === contentId
    })

    if (!item) {
      callback(createErrorResponse(platform.id, 404, 'Content not found'))
      return
    }

    callback({
      data: item.episodesList || [],
      meta: createMeta(platform.id),
    })
  })
}

export function clearCatalogCache(platformId?: string): void {
  if (platformId) {
    delete catalogCache[platformId]
    return
  }

  const keys = Object.keys(catalogCache)
  for (let i = 0; i < keys.length; i += 1) {
    delete catalogCache[keys[i]]
  }
}

export function clearStreamCache(streamKey?: string): void {
  if (streamKey) {
    delete streamCache[streamKey]
    return
  }

  const keys = Object.keys(streamCache)
  for (let i = 0; i < keys.length; i += 1) {
    delete streamCache[keys[i]]
  }
}

export function backendPrepareStream(
  platform: StreamingPlatform,
  accessToken: string | undefined,
  anime: Anime,
  episodeNumber: number,
  callback: (response: ApiResponse<{ playbackUrl: string }> | ApiErrorResponse) => void
): void {
  const sourceUrl = anime.streamUrlHls || anime.streamUrl || anime.streamUrlMp4
  const isCrunchyroll = platform.id === 'crunchyroll'
  const canResolveCrunchyrollStream = isCrunchyroll && !!anime.externalId

  if (!sourceUrl && !canResolveCrunchyrollStream) {
    callback(createErrorResponse(platform.id, 400, 'No stream URL available'))
    return
  }

  const streamKey =
    platform.id +
    ':' +
    (sourceUrl || anime.externalId || 'no-source') +
    ':' +
    String(episodeNumber || 1)
  const cachedUrl = streamCache[streamKey]
  if (cachedUrl) {
    callback({
      data: { playbackUrl: cachedUrl },
      meta: createMeta(platform.id),
    })
    return
  }

  const path = isCrunchyroll ? '/stream/receive-video' : '/stream/process-hls'
  const body = isCrunchyroll
    ? {
        url: sourceUrl,
        platform: platform.id,
        quality: 'medium',
        contentId: anime.externalId,
        streamsLink: anime.streamsLink,
        episodeNumber,
      }
    : {
        url: sourceUrl,
        platform: platform.id,
      }

  request<StreamPayload>(
    'POST',
    path,
    platform.id,
    body,
    accessToken ? { Authorization: 'Bearer ' + accessToken } : null,
    function onPrepared(response) {
      if (isApiErrorResponse(response)) {
        callback(response)
        return
      }

      if (!response.data || !response.data.outputUrl) {
        callback(createErrorResponse(platform.id, 500, 'Missing stream output URL'))
        return
      }

      const playbackUrl = toAbsoluteBackendUrl(response.data.outputUrl)
      streamCache[streamKey] = playbackUrl
      callback({
        data: { playbackUrl },
        meta: createMeta(platform.id),
      })
    }
  )
}
