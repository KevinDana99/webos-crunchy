import { Anime, Category, Season, StreamingPlatform } from '../types';

const BASE_IMAGE = 'https://picsum.photos';

export const mockAnime: Anime[] = [
  {
    id: '1',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    titleJapanese: '鬼滅の刃',
    synopsis: 'Tanjiro Kamado es un joven que vende carbón para ganarse la vida, pero su mundo cambia cuando un demonio assassina a su familia y convierte a su hermana Nezuko en un demonio. Ahora debe buscar una cura para su hermana y vengar a su familia.',
    image: `${BASE_IMAGE}/seed/demon1/400/600`,
    year: 2019,
    episodes: 26,
    status: 'completed',
    rating: 92,
    genres: ['Acción', 'Demonios', 'Historico', 'Shounen'],
    studios: ['Ufotable'],
    season: 'Winter 2019',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
    episodesList: [
      { number: 1, title: 'Cruelty', description: 'La historia de Tanjiro y su familia.', thumbnail: `${BASE_IMAGE}/seed/ep11/320/180`, duration: 24, airedDate: '2019-04-06' },
      { number: 2, title: 'The Stranger', description: 'Tanjiro conoce a un cazador de demonios.', thumbnail: `${BASE_IMAGE}/seed/ep12/320/180`, duration: 24, airedDate: '2019-04-13' },
      { number: 3, title: 'Awakening', description: 'Tanjiro despierta su habilidad.', thumbnail: `${BASE_IMAGE}/seed/ep13/320/180`, duration: 24, airedDate: '2019-04-20' },
      { number: 4, title: 'The First Step', description: 'Tanjiro comienza su entrenamiento.', thumbnail: `${BASE_IMAGE}/seed/ep14/320/180`, duration: 24, airedDate: '2019-04-27' },
      { number: 5, title: 'My Own Steel', description: 'El viaje de Tanjiro continúa.', thumbnail: `${BASE_IMAGE}/seed/ep15/320/180`, duration: 24, airedDate: '2019-05-04' },
    ]
  },
  {
    id: '2',
    title: 'Attack on Titan',
    titleJapanese: '進撃の巨人',
    synopsis: 'En un mundo donde la humanidad vive dentro de ciudades rodeadas por enormes muros, Eren Yeager jura venganza contra los titanes que destruyeron su hogar.',
    image: `${BASE_IMAGE}/seed/titan1/400/600`,
    year: 2013,
    episodes: 87,
    status: 'completed',
    rating: 89,
    genres: ['Acción', 'Drama', 'Fantasía', 'Misterio'],
    studios: ['Wit Studio', 'MAPPA'],
    season: 'Summer 2013',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
    episodesList: [
      { number: 1, title: 'To You, 2000 Years Later', description: 'Eren testimonia la caída de Shiganshina.', thumbnail: `${BASE_IMAGE}/seed/aot11/320/180`, duration: 24, airedDate: '2013-04-07' },
      { number: 2, title: 'That Day', description: 'El día en que todo cambió.', thumbnail: `${BASE_IMAGE}/seed/aot12/320/180`, duration: 24, airedDate: '2013-04-14' },
    ],
    seasons: [
      {
        id: 's1',
        name: 'Season 1',
        year: 2013,
        season: 'summer',
        episodes: [
          { number: 1, title: 'To You, 2000 Years Later', description: 'Eren testimonia la caída de Shiganshina.', thumbnail: `${BASE_IMAGE}/seed/aot11/320/180`, duration: 24, airedDate: '2013-04-07' },
          { number: 2, title: 'That Day', description: 'El día en que todo cambió.', thumbnail: `${BASE_IMAGE}/seed/aot12/320/180`, duration: 24, airedDate: '2013-04-14' },
          { number: 3, title: 'A Dim Light', description: 'Eren se une al ejército.', thumbnail: `${BASE_IMAGE}/seed/aot13/320/180`, duration: 24, airedDate: '2013-04-21' },
          { number: 4, title: 'The First Dinner', description: 'El primer entrenamiento.', thumbnail: `${BASE_IMAGE}/seed/aot14/320/180`, duration: 24, airedDate: '2013-04-28' },
        ]
      },
      {
        id: 's2',
        name: 'Season 2',
        year: 2017,
        season: 'spring',
        episodes: [
          { number: 1, title: 'Beast Titan', description: 'Un nuevo enemigo aparece.', thumbnail: `${BASE_IMAGE}/seed/aot21/320/180`, duration: 24, airedDate: '2017-04-01' },
          { number: 2, title: 'Ruler of the Walls', description: 'Historia de los muros.', thumbnail: `${BASE_IMAGE}/seed/aot22/320/180`, duration: 24, airedDate: '2017-04-08' },
          { number: 3, title: 'Bite', description: 'Eren despierta un nuevo poder.', thumbnail: `${BASE_IMAGE}/seed/aot23/320/180`, duration: 24, airedDate: '2017-04-15' },
        ]
      },
      {
        id: 's3',
        name: 'Season 3',
        year: 2018,
        season: 'summer',
        episodes: [
          { number: 1, title: 'Smoke Signal', description: 'El plan para recuperar Wall Maria.', thumbnail: `${BASE_IMAGE}/seed/aot31/320/180`, duration: 24, airedDate: '2018-07-23' },
          { number: 2, title: 'The State of the Walls', description: 'La verdadera historia del rey.', thumbnail: `${BASE_IMAGE}/seed/aot32/320/180`, duration: 24, airedDate: '2018-07-30' },
        ]
      },
      {
        id: 's4',
        name: 'Season 4',
        year: 2020,
        season: 'winter',
        episodes: [
          { number: 1, title: 'The Dawn of Remorse', description: 'Los invasores Marleyanos.', thumbnail: `${BASE_IMAGE}/seed/aot41/320/180`, duration: 24, airedDate: '2020-12-07' },
          { number: 2, title: 'The War Hammer Titan', description: 'Lilly y la familia Yeager.', thumbnail: `${BASE_IMAGE}/seed/aot42/320/180`, duration: 24, airedDate: '2020-12-14' },
          { number: 3, title: 'Door to Freedom', description: 'La nueva alianza.', thumbnail: `${BASE_IMAGE}/seed/aot43/320/180`, duration: 24, airedDate: '2020-12-21' },
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Jujutsu Kaisen',
    titleJapanese: '呪術廻戦',
    synopsis: 'Yuji Itadori, un estudiante de secundaria con una fuerza física extraordinaria, se encuentra con una maldición malvada y entra al mundo de los Jujutsu.',
    image: `${BASE_IMAGE}/seed/jujuts1/400/600`,
    year: 2020,
    episodes: 24,
    status: 'completed',
    rating: 88,
    genres: ['Acción', 'Escolar', 'Sobrenatural'],
    studios: ['MAPPA'],
    season: 'Fall 2020',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
  },
  {
    id: '4',
    title: 'One Piece',
    titleJapanese: 'ワンピース',
    synopsis: 'Monkey D. Luffy se pone como meta tener un sombrero de paja y convertirse en el Rey de los Piratas.',
    image: `${BASE_IMAGE}/seed/onepiec1/400/600`,
    year: 1999,
    episodes: 1000,
    status: 'ongoing',
    rating: 91,
    genres: ['Aventura', 'Comedia', 'Fantasía', 'Shounen'],
    studios: ['Toei Animation'],
    season: 'Fall 1999',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
  },
  {
    id: '5',
    title: 'Chainsaw Man',
    titleJapanese: 'チェンソーマン',
    synopsis: 'Denji es un joven que está muerto de deudas. Pero todo cambia cuando se fusiona con su perro demoníaco Chainsaw.',
    image: `${BASE_IMAGE}/seed/chains1/400/600`,
    year: 2022,
    episodes: 12,
    status: 'completed',
    rating: 85,
    genres: ['Acción', 'Sobrenatural', 'Drama'],
    studios: ['MAPPA'],
    season: 'Fall 2022',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
  },
  {
    id: '6',
    title: 'Spy x Family',
    titleJapanese: 'スパイファミリー',
    synopsis: 'Un espía, una asesina y una niña telépática forman una familia temporal para cumplir sus misiones.',
    image: `${BASE_IMAGE}/seed/spy1/400/600`,
    year: 2022,
    episodes: 25,
    status: 'completed',
    rating: 90,
    genres: ['Acción', 'Comedia', 'Escolar'],
    studios: ['Wit Studio', 'CloverWorks'],
    season: 'Spring 2022',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
  },
  {
    id: '7',
    title: 'Dragon Ball Z',
    titleJapanese: 'Dragon Ball Z Kai',
    synopsis: 'Goku y sus amigos deben proteger la Tierra de los Saiyan invasores y otros villanos.',
    image: `${BASE_IMAGE}/seed/dragon1/400/600`,
    year: 1989,
    episodes: 291,
    status: 'completed',
    rating: 87,
    genres: ['Acción', 'Aventura', 'Comedia', 'Shounen'],
    studios: ['Toei Animation'],
    season: 'Spring 1989',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
  },
  {
    id: '8',
    title: 'My Hero Academia',
    titleJapanese: '僕のヒーローアカデミア',
    synopsis: 'En un mundo donde el 80% de la población tiene superpoderes llamado "Quirk", Izuki Midoriya sueña con convertirse en héroe.',
    image: `${BASE_IMAGE}/seed/hero1/400/600`,
    year: 2016,
    episodes: 13,
    status: 'completed',
    rating: 86,
    genres: ['Acción', 'Escolar', 'Shounen'],
    studios: ['Bones'],
    season: 'Spring 2016',
    streamUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
  },
];

export const mockCategories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'trending', name: 'Trending Now' },
  { id: 'popular', name: 'Most Popular' },
  { id: 'new', name: 'New on Crunchyroll' },
  { id: 'simulcast', name: 'Simulcast' },
  { id: 'action', name: 'Action' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'drama', name: 'Drama' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'horror', name: 'Horror' },
  { id: 'romance', name: 'Romance' },
  { id: 'scifi', name: 'Sci-Fi' },
  { id: 'sliceoflife', name: 'Slice of Life' },
  { id: 'sports', name: 'Sports' },
  { id: 'supernatural', name: 'Supernatural' },
];

export const mockSeasons: Season[] = [
  { id: 'spring-2024', name: 'Spring 2024', year: 2024, season: 'spring' },
  { id: 'winter-2024', name: 'Winter 2024', year: 2024, season: 'winter' },
  { id: 'fall-2023', name: 'Fall 2023', year: 2023, season: 'fall' },
  { id: 'summer-2023', name: 'Summer 2023', year: 2023, season: 'summer' },
  { id: 'spring-2023', name: 'Spring 2023', year: 2023, season: 'spring' },
  { id: 'winter-2023', name: 'Winter 2023', year: 2023, season: 'winter' },
];

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

export function getAnimeById(id: string): Anime | undefined {
  return mockAnime.find((a) => a.id === id);
}

export function searchAnime(query: string): Anime[] {
  const q = query.toLowerCase();
  return mockAnime.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.titleJapanese?.toLowerCase().includes(q) ||
      a.synopsis.toLowerCase().includes(q) ||
      a.genres.some((g) => g.toLowerCase().includes(q))
  );
}
