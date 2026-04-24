import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { streamingPlatforms, currentPlatform, authenticate, register, selectPlatform } from '../../state/appState';
import { StreamingPlatform } from '../../types';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { route } = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatform>(currentPlatform.value!);

  const handlePlatformSelect = (platform: StreamingPlatform) => {
    setSelectedPlatform(platform);
    selectPlatform(platform);
  };

  const getPlatformMark = (platform: StreamingPlatform) => {
    return platform.name
      .replace('+', '')
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const markImageFailed = (key: string) => {
    setFailedImages((current) => ({
      ...current,
      [key]: true
    }));
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    if (isLogin) {
      authenticate(selectedPlatform, email, password, (user) => {
        setLoading(false);
        if (user) {
          route('/');
        } else {
          setError('Invalid credentials');
        }
      });
    } else {
      register(selectedPlatform, {
        email,
        password,
        username: username || email.split('@')[0]
      }, (user) => {
        setLoading(false);
        if (user) {
          route('/');
        } else {
          setError('Invalid credentials');
        }
      });
    }
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
        <div class={styles.platformSelector}>
          {streamingPlatforms.value.map((platform) => (
            <button
              key={platform.id}
              class={`${styles.platformBtn} ${selectedPlatform.id === platform.id ? styles.activePlatform : ''}`}
              style={{ '--platform-color': platform.accentColor } as any}
              onClick={() => handlePlatformSelect(platform)}
            >
              <span class={styles.platformLogo}>
                {!failedImages[platform.id] && (
                  <img
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    onError={() => markImageFailed(platform.id)}
                  />
                )}
                {failedImages[platform.id] && getPlatformMark(platform)}
              </span>
              <span class={styles.platformName}>{platform.name}</span>
            </button>
          ))}
        </div>

        <h1 class={styles.logo} style={{ color: selectedPlatform.accentColor }}>
          {selectedPlatform.name}
        </h1>
        
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

          <button 
            type="submit" 
            class={styles.submitBtn}
            style={{ background: selectedPlatform.accentColor }}
            disabled={loading}
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div class={styles.divider}>
          <span>or</span>
        </div>

        <div class={styles.social}>
          <button class={styles.socialBtn}>
            <span class={styles.socialIcon}>
              {!failedImages.google && (
                <img
                  src="/icons/social/google.png"
                  alt=""
                  onError={() => markImageFailed('google')}
                />
              )}
              {failedImages.google && 'G'}
            </span>
            Continue with Google
          </button>
          <button class={styles.socialBtn}>
            <span class={styles.socialIcon}>
              {!failedImages.facebook && (
                <img
                  src="/icons/social/facebook.png"
                  alt=""
                  onError={() => markImageFailed('facebook')}
                />
              )}
              {failedImages.facebook && 'f'}
            </span>
            Continue with Facebook
          </button>
        </div>

        <p class={styles.terms}>
          By continuing, you agree to {selectedPlatform.name}'s{' '}
          <a href="#">Terms of Service</a> and{' '}
          <a href="#">Privacy Policy</a>.
        </p>
      </div>

        <button class={styles.skipBtn} onClick={() => {
          selectPlatform(selectedPlatform);
          route('/');
        }}>
          Skip for now →
        </button>
    </div>
  );
}
