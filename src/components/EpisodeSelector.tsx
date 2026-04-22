import { currentAnime, currentEpisode, playAnime } from '../state/appState';
import styles from './EpisodeSelector.module.css';

interface EpisodeSelectorProps {
  onClose: () => void;
}

export function EpisodeSelector({ onClose }: EpisodeSelectorProps) {
  const anime = currentAnime.value;
  const currentEp = currentEpisode.value;
  const episodes = anime?.episodesList || [];

  if (!anime) return null;

  return (
    <div class={styles.container}>
      <div class={styles.header}>
        <h3 class={styles.title}>Episodes</h3>
        <button class={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      
      <div class={styles.info}>
        <img src={anime.image} alt={anime.title} class={styles.thumb} />
        <div>
          <h4 class={styles.animeTitle}>{anime.title}</h4>
          <span class={styles.epCount}>{anime.episodes} episodes</span>
        </div>
      </div>

      <div class={styles.list}>
        {episodes.map((ep) => (
          <button
            key={ep.number}
            class={`${styles.episode} ${currentEp === ep.number ? styles.active : ''}`}
            onClick={() => { playAnime(anime, ep.number); onClose(); }}
          >
            <span class={styles.epNum}>{ep.number}</span>
            <div class={styles.epInfo}>
              <span class={styles.epTitle}>{ep.title}</span>
              <span class={styles.epDesc}>{ep.description}</span>
            </div>
            <span class={styles.epDuration}>{ep.duration}m</span>
          </button>
        ))}
      </div>
    </div>
  );
}