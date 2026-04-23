import { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { Anime } from '../types'
import {
  ApiErrorResponse,
  ApiMeta,
  ApiPagination,
  AuthSession,
  ContentDetail,
  ContentKind,
  PlatformCatalog
} from '../types/api'
import { getPlatformData, MockAccount } from './mockData'

const DEFAULT_PAGE_SIZE = 12
const NETWORK_DELAY = 350

function requestId() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function meta(platform: string): ApiMeta {
  return {
    requestId: requestId(),
    platform,
    timestamp: new Date().toISOString()
  }
}

function parseBody<T>(data: AxiosRequestConfig['data']): T {
  if (!data) return {} as T
  if (typeof data === 'string') return JSON.parse(data) as T
  return data as T
}

function getPath(config: AxiosRequestConfig) {
  const rawUrl = config.url || '/'
  return rawUrl.replace(/^https?:\/\/[^/]+/, '').split('?')[0]
}

function getQuery(config: AxiosRequestConfig) {
  const params = (config.params || {}) as Record<string, string | number | undefined>
  const query: Record<string, string> = {}

  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== undefined) query[key] = String(value)
  })

  return query
}

function response<T>(config: AxiosRequestConfig, status: number, data: T): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers: {},
    config: config as InternalAxiosRequestConfig,
    request: null
  }
}

function error(config: AxiosRequestConfig, status: number, platform: string, code: string, message: string) {
  return response<ApiErrorResponse>(config, status, {
    error: {
      code,
      message,
      status
    },
    meta: meta(platform)
  })
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    } as ApiPagination
  }
}

function contentKind(item: Anime): ContentKind {
  return item.episodes === 1 ? 'movie' : 'series'
}

function filterContent(items: Anime[], query: Record<string, string>) {
  let results = items.slice()

  if (query.kind) {
    results = results.filter((item) => contentKind(item) === query.kind)
  }

  if (query.categoryId && query.categoryId !== 'all') {
    if (query.categoryId === 'trending') {
      results = results.sort((a, b) => b.rating - a.rating)
    } else if (query.categoryId === 'popular') {
      results = results.sort((a, b) => b.episodes - a.episodes)
    } else if (query.categoryId === 'new') {
      results = results.filter((item) => item.status === 'ongoing')
    } else if (query.categoryId === 'simulcast') {
      results = results.filter((item) => item.year >= 2023)
    } else {
      results = results.filter((item) =>
        item.genres.some((genre) => genre.toLowerCase() === query.categoryId.toLowerCase())
      )
    }
  }

  if (query.seasonId) {
    const seasonYear = Number(query.seasonId.match(/\d{4}/)?.[0] || 0)
    if (seasonYear) {
      results = results.filter((item) => item.year === seasonYear)
    }
  }

  if (query.search) {
    const search = query.search.toLowerCase()
    results = results.filter((item) =>
      item.title.toLowerCase().includes(search) ||
      item.titleJapanese?.toLowerCase().includes(search) ||
      item.synopsis.toLowerCase().includes(search) ||
      item.genres.some((genre) => genre.toLowerCase().includes(search))
    )
  }

  return results
}

function createSession(platformId: string, account: MockAccount): AuthSession {
  const expiresIn = 24 * 60 * 60

  return {
    user: {
      id: `${platformId}-${account.username}`,
      email: account.email,
      username: account.username,
      avatar: account.avatar,
      platform: platformId,
      token: `${platformId}-access-${Date.now()}`,
      expiresAt: Date.now() + expiresIn * 1000
    },
    accessToken: `${platformId}-access-${Date.now()}`,
    refreshToken: `${platformId}-refresh-${Date.now()}`,
    tokenType: 'Bearer',
    expiresIn
  }
}

function route(config: AxiosRequestConfig): AxiosResponse {
  const path = getPath(config)
  const query = getQuery(config)
  const match = path.match(/^\/api\/([^/]+)\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?/)
  const platformId = match?.[1] || 'unknown'
  const resource = match?.[2] || ''
  const id = match?.[3]
  const child = match?.[4]
  const platformData = getPlatformData(platformId)

  if (!platformData) {
    return error(config, 404, platformId, 'PLATFORM_NOT_FOUND', 'Platform is not configured')
  }

  if (resource === 'auth' && config.method === 'post') {
    const body = parseBody<{ email: string; password: string }>(config.data)
    const account = platformData.accounts.find(
      (item) => item.email === body.email && item.password === body.password
    )

    if (!account) {
      return error(config, 401, platformId, 'INVALID_CREDENTIALS', 'Email or password is invalid')
    }

    return response(config, 200, {
      data: createSession(platformId, account),
      meta: meta(platformId)
    })
  }

  if (resource === 'register' && config.method === 'post') {
    const body = parseBody<{ email: string; password: string; username: string }>(config.data)

    if (!body.email || !body.password || !body.username || body.password.length < 4) {
      return error(config, 422, platformId, 'VALIDATION_ERROR', 'Email, username and password are required')
    }

    return response(config, 201, {
      data: createSession(platformId, {
        email: body.email,
        password: body.password,
        username: body.username
      }),
      meta: meta(platformId)
    })
  }

  if (resource === 'token' && config.method === 'post') {
    const session = createSession(platformId, platformData.accounts[0])
    return response(config, 200, {
      data: session,
      meta: meta(platformId)
    })
  }

  if (resource === 'catalog' && config.method === 'get') {
    const catalog: PlatformCatalog = {
      platform: platformData.platform,
      categories: platformData.categories,
      seasons: platformData.seasons,
      featured: platformData.content.slice(0, 4),
      continueWatching: platformData.content.slice(1, 4)
    }

    return response(config, 200, {
      data: catalog,
      meta: meta(platformId)
    })
  }

  if (resource === 'content' && config.method === 'get' && !id) {
    const page = Math.max(1, Number(query.page || 1))
    const pageSize = Math.max(1, Number(query.pageSize || DEFAULT_PAGE_SIZE))
    const filtered = filterContent(platformData.content, query)
    const paginated = paginate(filtered, page, pageSize)

    return response(config, 200, {
      data: paginated.items,
      pagination: paginated.pagination,
      meta: meta(platformId)
    })
  }

  if (resource === 'content' && config.method === 'get' && id && !child) {
    const item = platformData.content.find((content) => content.id === id)

    if (!item) {
      return error(config, 404, platformId, 'CONTENT_NOT_FOUND', 'Content item was not found')
    }

    const related = platformData.content
      .filter((content) => content.id !== item.id && content.genres.some((genre) => item.genres.includes(genre)))
      .slice(0, 6)

    const detail: ContentDetail = {
      item,
      seasons: item.seasons || [],
      related
    }

    return response(config, 200, {
      data: detail,
      meta: meta(platformId)
    })
  }

  if (resource === 'content' && config.method === 'get' && id && child === 'episodes') {
    const item = platformData.content.find((content) => content.id === id)

    if (!item) {
      return error(config, 404, platformId, 'CONTENT_NOT_FOUND', 'Content item was not found')
    }

    return response(config, 200, {
      data: item.episodesList || item.seasons?.[0]?.episodes || [],
      meta: meta(platformId)
    })
  }

  return error(config, 404, platformId, 'ROUTE_NOT_FOUND', 'Mock endpoint does not exist')
}

export const mockAdapter: AxiosAdapter = (config) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(route(config))
    }, NETWORK_DELAY)
  })
}
