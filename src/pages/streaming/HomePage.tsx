import { useLocation } from 'preact-iso';
import { Anime } from '../../types';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { HeroSection } from '../../components/HeroSection';
import { AnimeCard } from '../../components/AnimeCard';
import { SeasonSelector } from '../../components/SeasonSelector';
import {
  filteredAnime,
  searchResults,
  searchQuery,
  activeCategory,
  selectAnime,
  currentPage,
  totalPages,
  totalItems,
  nextPage,
  previousPage,
} from '../../state/appState';
import styles from './HomePage.module.css';

export function HomePage() {
  const { route } = useLocation();

  const handlePlay = (anime: Anime) => {
    selectAnime(anime);
    route('/info');
  };

  const showSearchResults = searchQuery.value && searchResults.value.length > 0;
  const animeList = showSearchResults ? searchResults.value : filteredAnime.value;
  const categoryName = activeCategory.value;
  const canGoBack = currentPage.value > 1;
  const canGoForward = currentPage.value < totalPages.value;

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

        {totalItems.value > 0 && (
          <div class={styles.pagination}>
            <button
              class={styles.pageBtn}
              disabled={!canGoBack}
              onClick={previousPage}
            >
              Previous
            </button>
            <span class={styles.pageInfo}>
              Page {currentPage.value} of {totalPages.value}
            </span>
            <button
              class={styles.pageBtn}
              disabled={!canGoForward}
              onClick={nextPage}
            >
              Next
            </button>
          </div>
        )}
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
