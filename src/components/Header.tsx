import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { setSearchQuery, showSidebar, showQueue, queue } from '../state/appState';
import styles from './Header.module.css';

export function Header() {
  const { route } = useLocation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setSearchQuery(input);
  };

  return (
    <header class={styles.header}>
      <div class={styles.left}>
        <button class={styles.menuBtn} onClick={() => showSidebar.value = true}>
          ☰
        </button>
        <button type="button" class={styles.logo} onClick={() => route('/')}>CRUNCHYROLL</button>
      </div>

      <form class={styles.searchForm} onSubmit={handleSubmit}>
        <input
          type="text"
          class={styles.searchInput}
          placeholder="Search anime..."
          value={input}
          onInput={(e) => setInput(e.currentTarget.value)}
        />
      </form>

      <div class={styles.right}>
        <button class={styles.queueBtn} onClick={() => { showQueue.value = !showQueue.value; showSidebar.value = false; }}>
          <span class={styles.queueIcon}>☰</span>
          Queue
          {queue.value.length > 0 && <span class={styles.badge}>{queue.value.length}</span>}
        </button>
        <button class={styles.loginBtn} onClick={() => route('/login')}>Sign In</button>
      </div>
    </header>
  );
}
