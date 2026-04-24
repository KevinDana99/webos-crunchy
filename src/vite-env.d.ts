/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ERUDA_ENABLED: string;
  readonly VITE_DEBUG_OVERLAY: string;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'shaka-player/dist/shaka-player.compiled.js' {
  const shaka: any;
  export default shaka;
}
