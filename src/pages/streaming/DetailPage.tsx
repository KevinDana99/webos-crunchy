import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { currentAnime } from '../../state/appState';
import { playAnime } from '../../state/appState';
import { AnimeSeason } from '../../types';
import styles from './DetailPage.module.css';

export function DetailPage() {
  const { route } = useLocation();
  const anime = currentAnime.value;
  const [selectedSeason, setSelectedSeason] = useState<AnimeSeason | null>(null);

  if (!anime) {
    return (
      <div class={styles.container}>
        <div class={styles.error}>
          <h1>Anime not found</h1>
          <button onClick={() => route('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const hasSeasons = anime.seasons && anime.seasons.length > 0;
  const seasons = anime.seasons || [];
  const activeSeason = selectedSeason || seasons[0] || null;
  const episodes = activeSeason?.episodes || anime.episodesList || [];
  const isMovie = anime.episodes === 1 && !hasSeasons;

  const handlePlay = (episodeNumber: number = 1) => {
    playAnime(anime, episodeNumber);
    route('/watch');
  };

  const handleSeasonChange = (season: AnimeSeason) => {
    setSelectedSeason(season);
  };

  return (
    <div class={styles.container}>
      <button class={styles.backBtn} onClick={() => route('/')}>
        ← Back
      </button>

      <div class={styles.hero}>
        <img src={anime.image} alt={anime.title} class={styles.heroImage} />
        <div class={styles.heroOverlay}>
          <div class={styles.heroContent}>
            <h1 class={styles.title}>{anime.title}</h1>
            {anime.titleJapanese && (
              <p class={styles.titleJapanese}>{anime.titleJapanese}</p>
            )}
            <div class={styles.meta}>
              <span class={styles.rating}>★ {anime.rating}%</span>
              <span class={styles.dot}>•</span>
              <span>{anime.year}</span>
              <span class={styles.dot}>•</span>
              <span>{anime.episodes} episodes</span>
              <span class={styles.dot}>•</span>
              <span>{anime.status}</span>
            </div>
            <div class={styles.genres}>
              {anime.genres.map((genre) => (
                <span key={genre} class={styles.genre}>{genre}</span>
              ))}
            </div>
            <div class={styles.studios}>
              Studio: {anime.studios.join(', ')}
            </div>
            <button class={styles.playBtn} onClick={() => handlePlay(1)}>
              ▶ Play
            </button>
          </div>
        </div>
      </div>

      <div class={styles.content}>
        <div class={styles.synopsis}>
          <h2>Synopsis</h2>
          <p>{anime.synopsis}</p>
        </div>

        {hasSeasons && (
          <div class={styles.seasonSection}>
            <div class={styles.seasonHeader}>
              <h2>Seasons & Episodes</h2>
              <div class={styles.seasonTabs}>
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    class={`${styles.seasonTab} ${activeSeason?.id === season.id ? styles.activeTab : ''}`}
                    onClick={() => handleSeasonChange(season)}
                  >
                    <span class={styles.seasonName}>{season.name}</span>
                    <span class={styles.seasonYear}>{season.year}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeSeason && (
              <div class={styles.episodeList}>
                {activeSeason.episodes.map((episode) => (
                  <button
                    key={episode.number}
                    class={styles.episodeCard}
                    onClick={() => handlePlay(episode.number)}
                  >
                    <img
                      src={episode.thumbnail}
                      alt={episode.title}
                      class={styles.episodeThumbnail}
                    />
                    <div class={styles.episodeInfo}>
                      <span class={styles.episodeNumber}>
                        Episode {episode.number}
                      </span>
                      <span class={styles.episodeTitle}>{episode.title}</span>
                      <span class={styles.episodeDuration}>
                        {episode.duration} min • {episode.airedDate}
                      </span>
                      <p class={styles.episodeDescription}>
                        {episode.description}
                      </p>
                    </div>
                    <span class={styles.episodePlay}>▶</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSeasons && !isMovie && episodes.length > 0 && (
          <div class={styles.episodes}>
            <h2>Episodes</h2>
            <div class={styles.episodeList}>
              {episodes.map((episode) => (
                <button
                  key={episode.number}
                  class={styles.episodeCard}
                  onClick={() => handlePlay(episode.number)}
                >
                  <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    class={styles.episodeThumbnail}
                  />
                  <div class={styles.episodeInfo}>
                    <span class={styles.episodeNumber}>
                      Episode {episode.number}
                    </span>
                    <span class={styles.episodeTitle}>{episode.title}</span>
                    <span class={styles.episodeDuration}>
                      {episode.duration} min • {episode.airedDate}
                    </span>
                    <p class={styles.episodeDescription}>
                      {episode.description}
                    </p>
                  </div>
                  <span class={styles.episodePlay}>▶</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isMovie && (
          <div class={styles.movie}>
            <h2>Watch Now</h2>
            <div class={styles.movieCard}>
              <img src={anime.image} alt={anime.title} class={styles.movieThumbnail} />
              <div class={styles.movieInfo}>
                <span class={styles.movieTitle}>{anime.title}</span>
                <span class={styles.movieYear}>{anime.year}</span>
              </div>
              <button
                class={styles.moviePlayBtn}
                onClick={() => handlePlay(1)}
              >
                ▶ Play Movie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}