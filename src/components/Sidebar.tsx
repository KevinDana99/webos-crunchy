import { categories, activeCategory, setActiveCategory, showSidebar, showQueue, queue, animeList } from '../state/appState';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const cats = categories.value;
  const active = activeCategory.value;
  const isOpen = showSidebar.value;
  const queueOpen = showQueue.value;

  const queueItems = animeList.value.filter((a) => queue.value.includes(a.id));

  return (
    <>
      <div class={`${styles.overlay} ${isOpen || queueOpen ? styles.open : ''}`} onClick={() => { showSidebar.value = false; showQueue.value = false; }} />
      <aside class={`${styles.sidebar} ${isOpen || queueOpen ? styles.open : ''}`}>
        <div class={styles.header}>
          {queueOpen ? 'Queue' : 'Browse'}
          <button class={styles.closeBtn} onClick={() => { showSidebar.value = false; showQueue.value = false; }}>✕</button>
        </div>
        
        {!queueOpen && (
          <nav class={styles.nav}>
            {cats.map((cat) => (
              <a
                key={cat.id}
                class={`${styles.link} ${active === cat.id ? styles.active : ''}`}
                onClick={() => { setActiveCategory(cat.id); showSidebar.value = false; }}
              >
                {cat.name}
              </a>
            ))}
          </nav>
        )}

        {queueOpen && (
          <div class={styles.queue}>
            {queueItems.length === 0 ? (
              <p class={styles.emptyQueue}>Your queue is empty</p>
            ) : (
              queueItems.map((anime) => (
                <div key={anime.id} class={styles.queueItem}>
                  <img src={anime.image} alt={anime.title} class={styles.queueThumb} />
                  <div class={styles.queueInfo}>
                    <span class={styles.queueTitle}>{anime.title}</span>
                    <span class={styles.queueEps}>{anime.episodes} eps</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </aside>
    </>
  );
}