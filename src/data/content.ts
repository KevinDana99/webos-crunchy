import { StreamingPlatform } from '../types';

export const mockPlatforms: StreamingPlatform[] = [
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    logo: '/icons/platforms/crunchyroll.png',
    accentColor: '#f47521',
    authEndpoint: '/api/crunchyroll/auth',
    tokenEndpoint: '/api/crunchyroll/token'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logo: '/icons/platforms/netflix.png',
    accentColor: '#e50914',
    authEndpoint: '/api/netflix/auth',
    tokenEndpoint: '/api/netflix/token'
  },
  {
    id: 'disney',
    name: 'Disney+',
    logo: '/icons/platforms/disney.png',
    accentColor: '#006e99',
    authEndpoint: '/api/disney/auth',
    tokenEndpoint: '/api/disney/token'
  },
  {
    id: 'amazon',
    name: 'Prime Video',
    logo: '/icons/platforms/amazon.png',
    accentColor: '#00a8e1',
    authEndpoint: '/api/amazon/auth',
    tokenEndpoint: '/api/amazon/token'
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    logo: '/icons/platforms/hbo.png',
    accentColor: '#7538e4',
    authEndpoint: '/api/hbo/auth',
    tokenEndpoint: '/api/hbo/token'
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    logo: '/icons/platforms/paramount.png',
    accentColor: '#0064ff',
    authEndpoint: '/api/paramount/auth',
    tokenEndpoint: '/api/paramount/token'
  },
  {
    id: 'starplus',
    name: 'Star+',
    logo: '/icons/platforms/starplus.png',
    accentColor: '#6421ff',
    authEndpoint: '/api/starplus/auth',
    tokenEndpoint: '/api/starplus/token'
  },
  {
    id: 'magis',
    name: 'Magis TV',
    logo: '/icons/platforms/magis.png',
    accentColor: '#00d084',
    authEndpoint: '/api/magis/auth',
    tokenEndpoint: '/api/magis/token'
  }
];
