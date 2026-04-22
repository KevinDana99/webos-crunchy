import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { route } = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Mock login
    route('/');
  };

  return (
    <div class={styles.container}>
      <div class={styles.bg}>
        <img 
          src="https://picsum.photos/seed/crunchybg/1920/1080" 
          alt="" 
          class={styles.bgImage} 
        />
        <div class={styles.bgOverlay} />
      </div>

      <div class={styles.card}>
        <h1 class={styles.logo}>CRUNCHYROLL</h1>
        
        <div class={styles.tabs}>
          <button 
            class={`${styles.tab} ${isLogin ? styles.active : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            class={`${styles.tab} ${!isLogin ? styles.active : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form class={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              class={styles.input}
              value={username}
              onInput={(e) => setUsername(e.currentTarget.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            class={styles.input}
            value={email}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
          <input
            type="password"
            placeholder="Password"
            class={styles.input}
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
          />
          
          {error && <p class={styles.error}>{error}</p>}

          <button type="submit" class={styles.submitBtn}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div class={styles.divider}>
          <span>or</span>
        </div>

        <div class={styles.social}>
          <button class={styles.socialBtn}>
            <span>G</span> Continue with Google
          </button>
          <button class={styles.socialBtn}>
            <span>f</span> Continue with Facebook
          </button>
        </div>

        <p class={styles.terms}>
          By continuing, you agree to Crunchyroll's{' '}
          <a href="#">Terms of Service</a> and{' '}
          <a href="#">Privacy Policy</a>.
        </p>
      </div>

      <button class={styles.skipBtn} onClick={() => route('/')}>
        Skip for now →
      </button>
    </div>
  );
}