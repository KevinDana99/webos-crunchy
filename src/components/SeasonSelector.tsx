import { seasons, activeSeason, setActiveSeason } from '../state/appState';
import styles from './SeasonSelector.module.css';

export function SeasonSelector() {
  const allSeasons = seasons.value;
  const active = activeSeason.value;

  return (
    <div class={styles.container}>
      <span class={styles.label}>Seasons</span>
      <div class={styles.seasons}>
        {allSeasons.map((season) => (
          <button
            key={season.id}
            class={`${styles.seasonBtn} ${active === season.id ? styles.active : ''}`}
            onClick={() => setActiveSeason(season.id)}
          >
            <span class={styles.seasonName}>{season.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}