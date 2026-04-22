import { Anime } from '../types';
import { playAnime, toggleQueue, isInQueue } from '../state/appState';
import styles from './AnimeCard.module.css';

interface AnimeCardProps {
  anime: Anime;
  size?: 'large' | 'medium' | 'small';
  onPlay?: (anime: Anime) => void;
}

export function AnimeCard({ anime, size = 'medium', onPlay }: AnimeCardProps) {
  const inQueue = isInQueue.value(anime.id);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(anime);
    } else {
      playAnime(anime);
    }
  };

  return (
    <div class={`${styles.card} ${styles[size]}`}>
      <button type="button" class={styles.imageWrapper} onClick={handlePlay}>
        <img src={anime.image} alt={anime.title} class={styles.image} />
        <div class={styles.overlay}>
          <span class={styles.playIcon}>▶</span>
        </div>
        <div class={styles.rating}>
          <span class={styles.ratingIcon}>★</span>
          {anime.rating}%
        </div>
        {anime.status === 'ongoing' && (
          <div class={styles.badge}>NEW</div>
        )}
      </button>
      <div class={styles.info}>
        <h3 class={styles.title}>{anime.title}</h3>
        <div class={styles.meta}>
          <span>{anime.year}</span>
          <span class={styles.dot}>•</span>
          <span>{anime.episodes} eps</span>
          <span class={styles.dot}>•</span>
          <span>{anime.genres[0]}</span>
        </div>
      </div>
      <button class={styles.queueBtn} onClick={() => toggleQueue(anime.id)}>
        {inQueue ? '✓' : '+'}
      </button>
    </div>
  );
}
