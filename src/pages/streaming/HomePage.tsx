import { useLocation } from 'preact-iso';
import { Anime } from '../../types';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { HeroSection } from '../../components/HeroSection';
import { AnimeCard } from '../../components/AnimeCard';
import { SeasonSelector } from '../../components/SeasonSelector';
import { filteredAnime, searchResults, searchQuery, activeCategory, playAnime } from '../../state/appState';
import styles from './HomePage.module.css';

export function HomePage() {
  const { route } = useLocation();

  const handlePlay = (anime: Anime) => {
    playAnime(anime);
    route('/watch');
  };

  const showSearchResults = searchQuery.value && searchResults.value.length > 0;
  const animeList = showSearchResults ? searchResults.value : filteredAnime.value;
  const categoryName = activeCategory.value;

  return (
    <div class={styles.container}>
      <Header />
      <Sidebar />
      
      <HeroSection />

      <SeasonSelector />

      <section class={styles.section}>
        <h2 class={styles.sectionTitle}>
          {showSearchResults ? 'Search Results' : categoryName === 'all' ? 'All Anime' : 'Browse'}
        </h2>
        <div class={styles.grid}>
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onPlay={handlePlay} />
          ))}
        </div>
      </section>

      {animeList.length === 0 && (
        <div class={styles.empty}>
          {showSearchResults ? 'No results found' : 'No anime available'}
        </div>
      )}

      <footer class={styles.footer}>
        <div class={styles.footerContent}>
          <div class={styles.footerLinks}>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Press</a>
            <a href="#">Careers</a>
          </div>
          <p class={styles.copyright}>© 2024 Crunchyroll. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}