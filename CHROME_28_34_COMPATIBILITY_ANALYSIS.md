# Análisis de Compatibilidad: Shaka Player en Chrome 28/34

## Resumen Ejecutivo

**Estado actual**: El proyecto usa shaka-player 4.7.0 con `browserslist: ["Chrome 34"]` pero **NO** instala polyfills ni verifica soporte. Chrome 28/34 son versiones muy antiguas (2013-2014) fuera del soporte oficial de shaka-player.

**Compatibilidad oficial shaka-player v4.x**:
- Mínimo: **Chrome 38+** (según mantenedores, Enero 2024)
- Requiere: MSE, Promises, CustomEvent, Uint8Array

## Análisis de Features por Versión

### Chrome 28 (Julio 2013)
❌ **NO compatible** con shaka-player:
- **MSE**: Solo versión prefijada (webkitMediaSource), muy limitada
- **Promises**: No soportado (agregado en Chrome 32)
- **CustomEvent**: Requiere polyfill
- **EME**: No existe (Chrome 42+)

### Chrome 34 (Marzo 2014)
⚠️ **Compatibilidad marginal**:
- **MSE**: ✅ Soportado sin prefijo (Chrome 31+)
- **Promises**: ❌ No nativo (Chrome 32+) → necesita polyfill
- **CustomEvent**: ⚠️ Verificar soporte exacto (Chrome 31+)
- **EME**: ❌ No soportado (Chrome 42+) → solo si contenido SIN DRM
- **Uint8Array**: ✅ Presente (ES6, Chrome 23+)

## Polyfills Requeridos para Chrome 34

### 1. **Promises** (Crítico)
Chrome 34 no tiene `Promise` nativo. Shaka-player incluye polyfill para IE11 que también cubre Chrome antiguo.

### 2. **CustomEvent** (Crítico)
Shaka-player provee polyfill que cae back a `createEvent`/`initCustomEvent`.

### 3. **EME v0.1b** (Opcional - solo DRM)
Para Chrome < 42. Shaka-player lo incluye. **No necesario si el stream no tiene DRM**.

### 4. **Otros polyfills automáticos**:
- `MediaSource` (parches de bugs)
- `VideoPlaybackQuality`
- ` VideoPlayPromise`
- `Fullscreen API`
- `Orientation`

## Implementación Requerida

### Archivo: `src/components/StreamingPlayer.tsx`

```typescript
import { useEffect, useRef, useState } from 'preact/hooks'
import shaka from 'shaka-player'
import { playerState, currentAnime, currentEpisode } from '../state/appState'
import styles from './StreamingPlayer.module.css'

export function StreamingPlayer({ onBack }: StreamingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !anime) return

    // 1. INSTALAR POLYFILLS ANTES DE TODO
    shaka.polyfill.installAll()

    // 2. VERIFICAR SOPORTE
    if (!shaka.Player.isBrowserSupported()) {
      console.error('Shaka Player: Navegador no soportado')
      // Mostrar mensaje de error al usuario
      return
    }

    const player = new shaka.Player()
    player.attach(video)

    // Configuración para mejor compatibilidad
    player.configure({
      // Reducir requirements para navegadores antiguos
      streaming: {
        // Buffering más conservador
        bufferBehind: 30,
        bufferAhead: 30,
        rebufferingGoal: 2,
        // Sin Adaptive bitrate inicial
        loadMinForwardProgress: 3,
      },
      // Mantener simplicity
      manifest: {
        // Parsing más simple
        parserFactory: null, // Usar default
        // Sin retry excesivo
        retryParameters: {
          minTimeout: 1000,
          maxTimeout: 60000,
        }
      },
      // Codecs preferidos para compatibilidad
      preferredVideoCodecs: ['avc1.42E01E', 'avc1.58A01E'], // Baseline/Main H.264
      preferredAudioCodecs: ['mp4a.40.2'], // AAC-LC
      // Sin DRM si no es necesario
      drm: {
        clearKeys: {},
        servers: {}
      }
    })

    player.load(anime.streamUrl).catch((err) => {
      console.error('Error loading stream:', err)
      // Manejar errores específicos de compatibilidad
      if (err.code === shaka.util.Error.Code.MEDIA_SOURCE_NOT_SUPPORTED) {
        console.error('MSE no soportado en este navegador')
      }
    })

    return () => {
      player.destroy()
    }
  }, [anime?.id])
```

## Consideraciones Técnicas

### Content Type (DASH MP4)
El stream usado es `dash.mpd` con MP4/ISO-BMFF container. Chrome 34 con MSE soporta:
- Container: MP4 ✅ (desde Chrome 30+ con MSE)
- Codec: H.264 ✅ (Chrome 34 soporta Baseline/Main profiles)
- Audio: AAC ✅

**Limitaciones Chrome 34**:
- **Sin soporte para codecs modernos**: VP9, AV1, HEVC no disponibles
- **MSE bugs conocidos**: Chrome 31-35 tenía bugs en SourceBuffer append
- **Sin Adaptive Bitrate robusto**: Puede fallar en cambios de calidad
- **Sin buffering predictivo**: Menos suave

### DRM / EME
Los streams demo de Google (`shaka-demo-assets/angel-one/dash.mpd`) son **clear content** (sin DRM). Por lo tanto EME **no es necesario**.

Si el contenido tuviera DRM (Widevine), Chrome 34 NO funcionaría (EME agregado en Chrome 42).

## Estrategias de Fallback

### Para Chrome < 34 (como Chrome 28):
1. **Feature Detection**:
```typescript
if (!window.MediaSource || !window.Promise) {
  // Mostrar mensaje: "Actualice su navegador"
  // O usar reproductor nativo <video src="directo.mp4">
  const video = videoRef.current
  if (video && anime) {
    video.src = anime.streamUrl.replace('.mpd', '.mp4') // si existe
    video.controls = true
  }
  return
}
```

2. **Reproductor nativo fallback**:
- Descargar segmentos DASH manualmente (complejo)
- O proveer streaming progresivo MP4 como alternativa

### Para Chrome 34:
Con polyfills debería funcionar para **contenido clear**:
```html
<script src="https://cdn.jsdelivr.net/npm/shaka-player@4.7.0/dist/shaka-player.compiled.js"></script>
<script>
// Polyfills se auto-instalan con installAll()
shaka.polyfill.installAll();
</script>
```

## Testing en BrowserStack

### Configuración recomendada:
```javascript
// browserstack.json
{
  "browsers": [
    {"browser": "chrome", "browser_version": "34.0", "os": "Windows", "os_version": "7"},
    {"browser": "chrome", "browser_version": "28.0", "os": "Windows", "os_version": "7"}
  ]
}
```

**Nota**: BrowserStack puede no tener Chrome 28/34 disponibles (suelen tener versiones recientes). Alternativas:
1. **Sauce Labs**: Tiene más versiones antiguas
2. **CrossBrowserTesting**: Amplio rango de versiones
3. **Virtual Machine local**: Instalar Chrome portable antiguo

### Comando de prueba local:
```bash
# Con Selenium WebDriver
npx selenium-side-runner -c "browserName=chrome browserVersion=34 platform=WINDOWS" test.side

# O con Playwright (limitado a versiones instaladas)
npx playwright test --browser=chromium --project="Chrome 34"
```

## Recomendaciones Finales

### 1. **Actualizar browserslist** (Prioridad Alta)
```json
// package.json
"browserslist": [
  "Chrome >= 60",  // Mínimo realista para shaka-player 4.x
  "Firefox >= 55",
  "Safari >= 11"
]
```
**Motivo**: Chrome 34 tiene 10+ años, <0.1% uso global. No vale el costo de mantenimiento.

### 2. **Implementar polyfills** (Prioridad Crítica)
```typescript
// En StreamingPlayer.tsx, línea 20:
useEffect(() => {
  // Instalar polyfills de shaka-player
  shaka.polyfill.installAll();

  if (!shaka.Player.isBrowserSupported()) {
    console.error('Browser not supported');
    return;
  }
  // ... resto del código
}, [])
```

### 3. **Agregar detección de features** (Prioridad Media):
```typescript
function checkCompatibility(): boolean {
  return !!(window.MediaSource && window.Promise && window.CustomEvent);
}
```

### 4. **Proporcionar fallback** (Prioridad Baja):
```typescript
if (!checkCompatibility()) {
  // Mostrar reproductor nativo con enlace de descarga
  // o mensaje para actualizar navegador
}
```

## Riesgos Identificados

1. **Seguridad**: Chrome 28/34 tienen vulnerabilidades críticas sin parche
2. **Performance**: MSE en Chrome 31-35 es lento e inestable
3. **Sin DRM**: Chrome <42 no soporta Widevine → contenido premium no funcionará
4. **Mantenimiento**: Shaka-player no testea en versiones <38, bugs no detectados
5. **Polyfills overhead**: Añaden ~20KB al bundle

## Conclusión

**Soporte Chrome 28/34 con shaka-player 4.7.0**:
- **Chrome 28**: ❌ Prácticamente imposible (falta MSE completo + Promises)
- **Chrome 34**: ⚠️ Teóricamente posible con polyfills, pero inestable y sin DRM
- **Recomendación**: NO soportar. Usar `browserslist: "Chrome >= 60"` y ofrecer fallback nativo para versiones antiguas.

**Acción inmediata**:
1. Añadir `shaka.polyfill.installAll()` y `isBrowserSupported()`
2. Actualizar `browserslist` a Chrome 60+
3. Implementar fallback a reproductor nativo para IE/Chrome antiguo

---

**Fuentes**:
- Shaka Player docs: https://shaka-player-demo.appspot.com/docs/api/
- Chrome platform status: MSE desde Chrome 23 (prefijado), Chrome 31 (sin prefijo)
- EME: Chrome 42+ nativo, polyfill v0.1b para Chrome < 42
- Can I use: MSE Chrome 23-30 (pref), 31+; EME Chrome 42+
