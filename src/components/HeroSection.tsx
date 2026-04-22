import { featuredAnime, playAnime } from '../state/appState';
import styles from './HeroSection.module.css';

export function HeroSection() {
  const anime = featuredAnime.value;

  if (!anime) return null;

  return (
    <div class={styles.hero}>
      <img src={anime.image} alt={anime.title} class={styles.bg} />
      <div class={styles.overlay} />
      <div class={styles.content}>
        <div class={styles.badges}>
          <span class={styles.badge}>HD</span>
          <span class={styles.badge}>SUB</span>
          <span class={styles.badge}>DUB</span>
        </div>
        <h1 class={styles.title}>{anime.title}</h1>
        {anime.titleJapanese && <p class={styles.japanese}>{anime.titleJapanese}</p>}
        <div class={styles.meta}>
          <span class={styles.rating}>★ {anime.rating}%</span>
          <span>{anime.year}</span>
          <span>{anime.episodes} eps</span>
          <span class={styles.status}>{anime.status}</span>
        </div>
        <p class={styles.synopsis}>{anime.synopsis.slice(0, 150)}...</p>
        <div class={styles.genres}>
          {anime.genres.map((genre) => (
            <span key={genre} class={styles.genre}>{genre}</span>
          ))}
        </div>
        <div class={styles.actions}>
          <button class={styles.playBtn} onClick={() => playAnime(anime)}>
            <span class={styles.playIcon}>▶</span>
            Play
          </button>
          <button class={styles.infoBtn}>ℹ</button>
          <button class={styles.queueBtn}>+ Add to Queue</button>
        </div>
      </div>
    </div>
  );
}