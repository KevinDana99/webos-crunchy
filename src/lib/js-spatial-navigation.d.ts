declare module 'js-spatial-navigation' {
  export default class SpatialNavigationLib {
    static init(): void;
    static uninit(): void;
    static add(config: { selector: string }, sectionId?: string): void;
    static remove(sectionId: string): void;
    static set(config: any, sectionId?: string): void;
    static disable(sectionId: string): void;
    static enable(sectionId: string): void;
    static pause(): void;
    static resume(): void;
    static focus(selector?: string | undefined, silent?: boolean): void;
    static move(direction: 'left' | 'right' | 'up' | 'down', selector?: string): void;
    static makeFocusable(sectionId?: string): void;
    static setDefaultSection(sectionId?: string): void;
  }

  const SpatialNavigation: SpatialNavigationLib;
  export default SpatialNavigation;
}

// Custom events from js-spatial-navigation
declare global {
  interface DocumentEventMap {
    'sn:focused': Event;
    'sn:willfocus': Event;
    'sn:unfocused': Event;
    'sn:willunfocus': Event;
    'sn:navigatefailed': Event;
    'sn:enter-down': Event;
    'sn:enter-up': Event;
  }
}
