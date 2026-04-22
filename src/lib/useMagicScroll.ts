import { useEffect, useRef } from 'preact/hooks';

const SCROLL_STEP = 300;

export function useMagicScroll() {
  const lastScrollY = useRef(window.scrollY);
  const timerRef = useRef<number>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 1536) {
        e.preventDefault();
        const before = window.scrollY;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          const after = window.scrollY;
          const diff = after - before;
          if (Math.abs(diff) >= 1) {
            const direction = diff > 0 ? 1 : -1;
            window.scrollBy(0, direction * SCROLL_STEP);
            lastScrollY.current = window.scrollY;
          }
        }, 50) as any;
      }
    };

    window.addEventListener('keydown', handleKeyDown, false);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
