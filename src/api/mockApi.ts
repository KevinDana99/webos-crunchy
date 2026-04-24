import { AuthUser, StreamingPlatform, Anime } from '../types';
import { ApiResponse, ApiErrorResponse, AuthSession, LoginRequest, RegisterRequest, PlatformCatalog, ContentDetail } from '../types/api';
import { getPlatformData, getAnimeForPlatform } from '../data/platformData';

// Mock users storage per platform
const mockUsers: Record<string, Array<{ email: string; password: string; username: string }>> = {
  crunchyroll: [
    { email: 'user@crunchyroll.com', password: 'demo123', username: 'CrunchyFan' }
  ],
  netflix: [
    { email: 'user@netflix.com', password: 'demo123', username: 'NetflixViewer' }
  ],
  disney: [
    { email: 'user@disney.com', password: 'demo123', username: 'DisneyLover' }
  ],
  amazon: [
    { email: 'user@amazon.com', password: 'demo123', username: 'PrimeMember' }
  ],
  hbo: [
    { email: 'user@hbo.com', password: 'demo123', username: 'HBOFan' }
  ],
  paramount: [
    { email: 'user@paramount.com', password: 'demo123', username: 'ParamountUser' }
  ],
  starplus: [
    { email: 'user@starplus.com', password: 'demo123', username: 'StarPlusFan' }
  ],
  magis: [
    { email: 'user@magis.com', password: 'demo123', username: 'MagisUser' }
  ]
};

// Platform-specific error messages
const platformErrors: Record<string, Record<string, string>> = {
  crunchyroll: {
    'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
    'ACCOUNT_LOCKED': 'Account temporarily locked. Try again later.',
    'REGION_RESTRICTED': 'Service not available in your region.',
    'NOT_FOUND': 'Content not found.'
  },
  netflix: {
    'INVALID_CREDENTIALS': 'Sorry, we don\'t recognize that email and password combination.',
    'ACCOUNT_LOCKED': 'Your account has been temporarily locked.',
    'REGION_RESTRICTED': 'Netflix is not available in this region.',
    'NOT_FOUND': 'Sorry, we couldn\'t find that title.'
  },
  disney: {
    'INVALID_CREDENTIALS': 'The email or password you entered is incorrect.',
    'ACCOUNT_LOCKED': 'Account locked for security reasons.',
    'REGION_RESTRICTED': 'Disney+ is not available in your country.',
    'NOT_FOUND': 'The requested content is not available.'
  },
  amazon: {
    'INVALID_CREDENTIALS': 'There was a problem with your request.',
    'ACCOUNT_LOCKED': 'Your account is temporarily unavailable.',
    'REGION_RESTRICTED': 'Prime Video not available in your location.',
    'NOT_FOUND': 'The requested video is not available.'
  },
  hbo: {
    'INVALID_CREDENTIALS': 'The email or password is incorrect.',
    'ACCOUNT_LOCKED': 'Too many failed attempts. Try again later.',
    'REGION_RESTRICTED': 'HBO Max not available in your region.',
    'NOT_FOUND': 'Content not available.'
  },
  paramount: {
    'INVALID_CREDENTIALS': 'Email or password is incorrect.',
    'ACCOUNT_LOCKED': 'Account temporarily suspended.',
    'REGION_RESTRICTED': 'Paramount+ not available in your country.',
    'NOT_FOUND': 'Title not found.'
  },
  starplus: {
    'INVALID_CREDENTIALS': 'Invalid credentials. Please try again.',
    'ACCOUNT_LOCKED': 'Account locked. Contact support.',
    'REGION_RESTRICTED': 'Star+ not available in your region.',
    'NOT_FOUND': 'Contenido no encontrado.'
  },
  magis: {
    'INVALID_CREDENTIALS': 'Usuario o contraseña incorrectos.',
    'ACCOUNT_LOCKED': 'Cuenta bloqueada temporalmente.',
    'REGION_RESTRICTED': 'Magis TV no disponible en tu país.',
    'NOT_FOUND': 'Contenido no disponible.'
  }
};

function generateToken(platform: StreamingPlatform): string {
  const prefixes: Record<string, string> = {
    crunchyroll: 'cr_',
    netflix: 'nf_',
    disney: 'dsny_',
    amazon: 'amz_',
    hbo: 'hbo_',
    paramount: 'pmt_',
    starplus: 'stp_',
    magis: 'mag_'
  };
  return (prefixes[platform.id] || 'tk_') + Math.random().toString(36).substr(2, 16);
}

function createSuccessResponse<T>(data: T, platform: string): ApiResponse<T> {
  return {
    data,
    meta: {
      requestId: platform + '_' + Date.now(),
      platform,
      timestamp: new Date().toISOString()
    }
  };
}

function createErrorResponse(code: string, platform: StreamingPlatform): ApiErrorResponse {
  var errors = platformErrors[platform.id] || platformErrors['crunchyroll'];
  return {
    error: {
      code: code,
      message: errors[code] || 'An error occurred',
      status: code === 'INVALID_CREDENTIALS' ? 401 : 403
    },
    meta: {
      requestId: platform.id + '_' + Date.now(),
      platform: platform.id,
      timestamp: new Date().toISOString()
    }
  };
}

function createAuthSession(platform: StreamingPlatform, user: AuthUser): AuthSession {
  return {
    user: user,
    accessToken: generateToken(platform),
    refreshToken: 'refresh_' + Math.random().toString(36).substr(2, 16),
    tokenType: 'Bearer',
    expiresIn: 86400000
  };
}

function simulateDelay(platform: StreamingPlatform, callback: () => void): void {
  var delays: Record<string, number> = {
    crunchyroll: 600,
    netflix: 800,
    disney: 500,
    amazon: 700,
    hbo: 650,
    paramount: 550,
    starplus: 450,
    magis: 400
  };
  var delay = delays[platform.id] || 500;
  setTimeout(callback, delay);
}

export function mockLogin(platform: StreamingPlatform, credentials: LoginRequest, callback: (response: ApiResponse<AuthSession> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var users = mockUsers[platform.id] || [];
    var user = users.find(function(u) { return u.email === credentials.email && u.password === credentials.password; });

    if (!user) {
      callback(createErrorResponse('INVALID_CREDENTIALS', platform));
      return;
    }

    var authUser: AuthUser = {
      id: platform.id + '_' + Date.now(),
      email: user.email,
      username: user.username,
      platform: platform.id,
      token: generateToken(platform),
      expiresAt: Date.now() + 86400000
    };

    var session = createAuthSession(platform, authUser);
    callback(createSuccessResponse(session, platform.id));
  });
}

export function mockRegister(platform: StreamingPlatform, data: RegisterRequest, callback: (response: ApiResponse<AuthSession> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var users = mockUsers[platform.id] || [];
    var existing = users.find(function(u) { return u.email === data.email; });

    if (existing) {
      callback(createErrorResponse('INVALID_CREDENTIALS', platform));
      return;
    }

    var newUser = {
      email: data.email,
      password: data.password,
      username: data.username
    };
    users.push(newUser);

    var authUser: AuthUser = {
      id: platform.id + '_' + Date.now(),
      email: newUser.email,
      username: newUser.username,
      platform: platform.id,
      token: generateToken(platform),
      expiresAt: Date.now() + 86400000
    };

    var session = createAuthSession(platform, authUser);
    callback(createSuccessResponse(session, platform.id));
  });
}

export function mockGetCatalog(platform: StreamingPlatform, callback: (response: ApiResponse<PlatformCatalog> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var data = getPlatformData(platform.id);
    var catalog: PlatformCatalog = {
      platform: platform,
      anime: data.anime,
      categories: data.categories,
      seasons: data.seasons,
      featured: data.anime.slice(0, 6),
      continueWatching: data.anime.slice(0, 3)
    };

    callback(createSuccessResponse(catalog, platform.id));
  });
}

export function mockGetContentDetail(platform: StreamingPlatform, contentId: string, callback: (response: ApiResponse<ContentDetail> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var anime = getAnimeForPlatform(platform.id, contentId);

    if (!anime) {
      callback(createErrorResponse('NOT_FOUND', platform));
      return;
    }

    var detail: ContentDetail = {
      item: anime,
      seasons: anime.seasons || [],
      related: getPlatformData(platform.id).anime.filter(function(a) { return a.id !== contentId; }).slice(0, 4)
    };

    callback(createSuccessResponse(detail, platform.id));
  });
}

export function mockRefreshToken(platform: StreamingPlatform, _refreshToken: string, callback: (response: ApiResponse<AuthSession> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var authUser: AuthUser = {
      id: platform.id + '_refreshed',
      email: 'user@refreshed.com',
      username: 'RefreshedUser',
      platform: platform.id,
      token: generateToken(platform),
      expiresAt: Date.now() + 86400000
    };

    var session = createAuthSession(platform, authUser);
    callback(createSuccessResponse(session, platform.id));
  });
}

export function mockLoadContent(platform: StreamingPlatform, query?: any, callback?: (response: ApiResponse<Anime[]> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var data = getPlatformData(platform.id);
    var anime = data.anime;

    if (query && query.categoryId && query.categoryId !== 'all') {
      anime = anime.filter(function(a) { return a.genres.some(function(g) { return g.toLowerCase() === query.categoryId.toLowerCase(); }); });
    }
    if (query && query.search) {
      var q = query.search.toLowerCase();
      anime = anime.filter(function(a) {
        return a.title.toLowerCase().indexOf(q) !== -1 || a.synopsis.toLowerCase().indexOf(q) !== -1;
      });
    }

    if (callback) {
      callback(createSuccessResponse(anime, platform.id));
    }
  });
}

export function mockLoadEpisodes(platform: StreamingPlatform, contentId: string, callback?: (response: ApiResponse<any[]> | ApiErrorResponse) => void): void {
  simulateDelay(platform, function() {
    var anime = getAnimeForPlatform(platform.id, contentId);

    if (!anime) {
      if (callback) callback(createErrorResponse('NOT_FOUND', platform));
      return;
    }

    if (callback) {
      callback(createSuccessResponse(anime.episodesList || [], platform.id));
    }
  });
}
