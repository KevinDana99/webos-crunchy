import { mockPlatforms } from '../data/content'
import { streamingApi } from './streamingApi'

export const datamock = {
  platforms() {
    return mockPlatforms
  },

  catalog(platformId: string) {
    return streamingApi.getCatalog(platformId)
  },

  movies(platformId: string, page = 1, pageSize = 12) {
    return streamingApi.getMovies(platformId, {
      page,
      pageSize
    })
  },

  series(platformId: string, page = 1, pageSize = 12) {
    return streamingApi.getSeries(platformId, {
      page,
      pageSize
    })
  },

  seasons(platformId: string) {
    return streamingApi.getCatalog(platformId).then((response) => response.data.seasons)
  },

  categories(platformId: string) {
    return streamingApi.getCatalog(platformId).then((response) => response.data.categories)
  },

  search(platformId: string, query: string, page = 1, pageSize = 12) {
    return streamingApi.getContent(platformId, {
      search: query,
      page,
      pageSize
    })
  },

  contentByCategory(platformId: string, categoryId: string, page = 1, pageSize = 12) {
    return streamingApi.getContent(platformId, {
      categoryId,
      page,
      pageSize
    })
  },

  contentBySeason(platformId: string, seasonId: string, page = 1, pageSize = 12) {
    return streamingApi.getContent(platformId, {
      seasonId,
      page,
      pageSize
    })
  },

  detail(platformId: string, contentId: string) {
    return streamingApi.getContentDetail(platformId, contentId)
  },

  episodes(platformId: string, contentId: string) {
    return streamingApi.getEpisodes(platformId, contentId)
  }
}
