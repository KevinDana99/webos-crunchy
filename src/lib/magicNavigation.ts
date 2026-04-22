/// <reference path="./js-spatial-navigation.d.ts" />
import { useEffect, useLayoutEffect, useState, useRef } from 'preact/hooks';
import SpatialNavigation from 'js-spatial-navigation';

export interface MagicNavigationProps<T> {
  items: T[];
  onSelect?: (item: T, index: number) => void;
}

export function useMagicNavigation<T>({ items, onSelect }: MagicNavigationProps<T>) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const indexRef = useRef(focusedIndex);

  useEffect(() => {
    indexRef.current = focusedIndex;
  }, [focusedIndex]);

  useLayoutEffect(() => {
    if (!items || items.length === 0) {
      console.log('[useMagicNavigation] no items, skipping init');
      return;
    }

    console.log('[useMagicNavigation] initializing SpatialNavigation with', items.length, 'items');
    SpatialNavigation.init();
    SpatialNavigation.add({ selector: '[data-focus-index]' });
    SpatialNavigation.makeFocusable();

    const handleFocused = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const idx = parseInt(target.getAttribute('data-focus-index') || '-1', 10);
      console.log('[sn:focused] target:', target?.tagName, 'data-focus-index:', target?.getAttribute('data-focus-index'), ' → index:', idx);
      if (!isNaN(idx)) {
        setFocusedIndex(idx);
        // Scroll automático si el elemento está fuera del viewport (Chrome 34 compatible)
        requestAnimationFrame(() => {
          const rect = target.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const margin = 60;
          if (rect.top < margin || rect.bottom > viewportHeight - margin) {
            const targetY = rect.top + window.scrollY - margin;
            window.scrollTo(0, targetY);
            console.log('  → auto-scroll to', Math.round(targetY), '(focused element out of view)');
          }
        });
      }
    };

    const handleEnterDown = (_e: Event) => {
      const active = document.activeElement as HTMLElement;
      const idx = parseInt(active.getAttribute('data-focus-index') || '-1', 10);
      console.log('[sn:enter-down] activeElement:', active?.tagName, 'data-focus-index:', active?.getAttribute('data-focus-index'), ' → index:', idx, 'items[idx]:', items[idx] ? 'OK' : 'undefined');
      if (!isNaN(idx) && items[idx]) {
        onSelect?.(items[idx], idx);
      }
    };

    const handleBackKey = (e: KeyboardEvent) => {
      console.log('[keydown-Back] keyCode:', e.keyCode);
      if (e.keyCode === 461 || e.keyCode === 27) {
        e.preventDefault();
        console.log('  → Back trigger onSelect({__back:true})');
        onSelect?.({ __back: true } as any, -1);
      }
    };

    const focusedListener = handleFocused as EventListener;
    const enterListener = handleEnterDown as EventListener;
    const backKeyListener = handleBackKey as EventListener;

    document.addEventListener('sn:focused', focusedListener);
    document.addEventListener('sn:enter-down', enterListener);
    window.addEventListener('keydown', backKeyListener, false);

    return () => {
      document.removeEventListener('sn:focused', focusedListener);
      document.removeEventListener('sn:enter-down', enterListener);
      window.removeEventListener('keydown', backKeyListener, false);
      SpatialNavigation.uninit();
    };
  }, [items, onSelect]);

  return { focusedIndex, setFocusedIndex };
}

export function FocusProvider(props: { children: any; focusedIndex: number }) {
  const { children, focusedIndex } = props;

  useEffect(() => {
    console.log('[FocusProvider] focusedIndex changed to:', focusedIndex);
    const all = document.querySelectorAll('[data-focus-index]');
    all.forEach((el) => {
      const isFocused = el.getAttribute('data-focus-index') === String(focusedIndex);
      el.classList.toggle('is-focused', isFocused);
      el.setAttribute('aria-selected', isFocused ? 'true' : 'false');
    });
  }, [focusedIndex]);

  return children;
}
