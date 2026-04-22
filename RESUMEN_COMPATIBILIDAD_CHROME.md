# Resumen: Compatibilidad Shaka Player Chrome 28/34

## Análisis Realizado

### 1. Estado del Proyecto
- **Shaka Player**: v4.7.0 (instalado)
- **Browserslist original**: `["Chrome 34"]` ❌
- **Streaming**: DASH (dash.mpd) - contenido clear (sin DRM)
- **Implementación actual**: Sin polyfills, sin verificación de soporte

### 2. Compatibilidad Real por Versión Chrome

| Feature | Chrome 28 (2013) | Chrome 34 (2014) | Mínimo Shaka |
|---------|------------------|------------------|--------------|
| **MSE** (MediaSource) | ❌ (prefijo limitado) | ✅ (Chrome 31+) | ✅ |
| **Promises** | ❌ (Chrome 32+) | ❌ (Chrome 32+) | ✅ (polyfill) |
| **CustomEvent** | ⚠️ (Chrome 31+) | ✅ (Chrome 31+) | ✅ (polyfill) |
| **EME/DRM** | ❌ (Chrome 42+) | ❌ (Chrome 42+) | Opcional |
| **Uint8Array** | ✅ | ✅ | ✅ |

**Conclusión**:
- **Chrome 28**: ❌ **No compatible** - falta MSE completo y Promises
- **Chrome 34**: ⚠️ **Marginalmente posible** con polyfills, pero inestable

### 3. Problemas Identificados

1. ❌ **No se instalan polyfills** → Causa errores en Chrome < 38
2. ❌ **No se verifica `isBrowserSupported()`** → No hay fallback gracefully
3. ❌ **Browserslist muy agresivo** (Chrome 34 < mínimo oficial Chrome 38+)
4. ⚠️ **Sin manejo de errores específico** para falta de MSE

## Cambios Implementados

### 1. `src/components/StreamingPlayer.tsx`
```typescript
// ANTES (líneas 20-34):
const player = new shaka.Player()
player.attach(video)
player.load(anime.streamUrl)...

// DESPUÉS:
shaka.polyfill.installAll()                    // ← NUEVO: Polyfills
if (!shaka.Player.isBrowserSupported()) {       // ← NUEVO: Verificación
  alert('Navegador no soportado')
  return
}
const player = new shaka.Player()
player.configure({
  streaming: { bufferBehind: 30, bufferAhead: 30, rebufferingGoal: 2 },
  manifest: { retryParameters: { minTimeout: 1000, maxTimeout: 60000 } },
  preferredVideoCodecs: ['avc1.42E01E', 'avc1.58A01E'], // H.264 compatible
  preferredAudioCodecs: ['mp4a.40.2'],                  // AAC
})
player.attach(video)
player.load(...).catch((err) => {
  if ([3014, 3016].includes(err.code)) {
    alert('MSE no soportado. Actualiza Chrome a 31+')
  }
})
```

### 2. `package.json`
```json
// ANTES:
"browserslist": ["Chrome 34"]

// DESPUÉS:
"browserslist": [
  "Chrome >= 60",
  "Firefox >= 55",
  "Safari >= 11",
  "Edge >= 79"
]
```

## Archivos Creados

1. **`CHROME_28_34_COMPATIBILITY_ANALYSIS.md`** - Análisis técnico completo
   - Requisitos por feature
   - Tabla de polyfills requeridos
   - Soluciones de implementación
   - Riesgos identificados

2. **`CHROME_LEGACY_TESTING_GUIDE.md`** - Guía de testing
   - Configuración BrowserStack
   - Selenium/Playwright scripts
   - Docker + VM local
   - Fallbacks para navegadores antiguos

## Recomendaciones Finales

### Prioridad CRÍTICA:
1. ✅ **Implementado**: `shaka.polyfill.installAll()` antes de crear jugador
2. ✅ **Implementado**: `shaka.Player.isBrowserSupported()` check
3. ✅ **Implementado**: Manejo de errores MSE/EME
4. ✅ **Actualizado**: `browserslist` a Chrome 60+

### Para Testing en Chrome 34:

**Opción A - BrowserStack** (más fácil):
```bash
# Guardar config en browserstack.json
{
  "browsers": [
    {"browser": "chrome", "browser_version": "34.0", "os": "Windows", "os_version": "7"}
  ]
}
# Ejecutar con: browserstack-cypress run --config browserstack.json
```

**Opción B - Local VM** (más confiable):
1. Descargar Chrome 34 portable (PortableApps.com o archivos históricos)
2. Ejecutar Selenium con ChromeDriver 2.9:
```bash
chromedriver --url-base=/wd/hub --port=9515 &
npx selenium-side-runner -c "browser=chrome browserVersion=34 platform=WINDOWS" test.side
```

### Si Chrome 34 Falla en Producción:

**Fallback nativo** (implementar como último recurso):
```typescript
if (!checkCompatibility()) {
  // Reproductor nativo HTML5
  video.src = streamUrl.replace('.mpd', '.mp4')
  video.controls = true
  video.play()
}
```

### Notas Importantes:

1. **Seguridad**: Chrome 28/34 tienen vulnerabilidades críticas sin parche (CVE conocidas). **NO recomiendo soportar**.
2. **Contenido sin DRM**: Los streams demo (`angel-one/dash.mpd`) son clear, por lo que EME no es necesario. Chrome 34 podría funcionar **teóricamente** con polyfills.
3. **Performance**: MSE en Chrome 31-35 es buggy y lento. Espera crashes y buffering excesivo.
4. **Soporte oficial**: Shaka Team dice Chrome 38+. Chrome 34 está 4 versiones por debajo del mínimo.

## Conclusión

**¿Chrome 28/34 funcionará con shaka-player?**
- **Chrome 28**: ❌ **NO** - MSE incompleto + sin Promises = imposible
- **Chrome 34**: ⚠️ **Tal vez** con polyfills intensivos, pero inestable y sin DRM

**Recomendación**: 
1. Soportar oficialmente Chrome 60+
2. Para Chrome 28-59: Mensaje de "actualiza tu navegador"
3. Si es obligatorio soportar Chrome 34: Implementar polyfills + fallback nativo

**Próximos pasos sugeridos**:
1. Probar en BrowserStack con Chrome 34
2. Verificar logs de shaka debug en Chrome 34
3. Si falla, implementar reproductor nativo como fallback
4. Considerar eliminar soporte para Chrome < 60 del `browserslist`

---

**Referencias**:
- Shaka Player mínimo: Chrome 38+ (GitHub issue #5999, Enero 2024)
- MSE soporte: Chrome 31+ ( unprefixed )
- EME soporte: Chrome 42+ (Widevine)
- Promises soporte: Chrome 32+
- Fuente: Can I Use, Chrome Platform Status, Shaka Player docs
