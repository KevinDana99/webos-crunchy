# Guía de Pruebas en Navegadores Antiguos (Chrome 28/34)

## Introducción

Chrome 28 (Julio 2013) y Chrome 34 (Marzo 2014) son versiones extremadamente antiguas con graves problemas de seguridad y compatibilidad. Shaka Player 4.7.0 oficialmente soporta **Chrome 38+**.

## Opciones de Testing

### 1. BrowserStack (Recomendado)

BrowserStack ofrece acceso a versiones antiguas de Chrome:

**Configuración Live (manual)**:
1. Registrarse en browserstack.com
2. Ir a "Live" → Seleccionar:
   - OS: Windows 7/8
   - Browser: Chrome
   - Version: 34 (disponible hasta ~Chrome 80 en algunos casos)
3. Navegar a tu app local con BrowserStack Local

**Configuración Automatizada (Selenium/WebDriver)**:
```javascript
// browserstack.json
{
  "test": "npm test",
  "browsers": [
    {
      "browser": "chrome",
      "browser_version": "34.0",
      "os": "Windows",
      "os_version": "7"
    }
  ]
}
```

**Limitación**: BrowserStack puede NO tener Chrome 28/34 disponibles (suelen tener desde ~Chrome 70-80 en adelante).

### 2. Sauce Labs

Similar a BrowserStack, puede tener más versiones antiguas:
- Chrome: 15-96 (según documentación)
- Requiere suscripción

### 3. Virtual Machine Local (Método más confiable)

**Descargar Chrome portable antiguo**:
```bash
# Chrome 34 portable (fuentes de archivo)
# 1. Descargar de archivos históricos:
#    - https://www.slimjet.com/chrome/google-chrome-old-version.php
#    - https://ftp.sqa.net.au/chrome/ (desactualizado)
# 2. Extraer y ejecutar chrome.exe --user-data-dir=/tmp/chrome34

# O usar PortableApps.com (limitado a versiones disponibles):
# https://portableapps.com/apps/internet/google_chrome_portable
```

**Método alternativo**: Usar Chromium builds antiguos:
```bash
# Instalar versión específica en Ubuntu/Debian:
sudo apt-get install chromium-browser=34.0.1847.116-0ubuntu0.12.04.2

# En Windows, modificar registry para usar versión portable específica
```

### 4. Docker + Selenium Standalone (Automated)

```dockerfile
# Dockerfile para testing multi-versión
FROM selenium/standalone-chrome:latest AS chrome_latest
# Para versiones antiguas necesitas custom image
```

### 5. ChromeDriver con Versión Específica

```bash
# Descargar ChromeDriver compatible con Chrome 34
# ChromeDriver 34.x: httpschromedriver.storage.googleapis.com/index.html?path=2.9/
wget httpschromedriver.storage.googleapis.com/2.9/chromedriver_win32.zip

# Ejecutar Selenium:
java -Dwebdriver.chrome.driver=chromedriver.exe \
     -Dwebdriver.chrome.whitelistedIps= \
     selenium-server-standalone.jar
```

## Configuración de Pruebas Automatizadas

### Usando Playwright (limitado)

Playwright solo puede testear versiones de Chrome instaladas localmente:

```javascript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  projects: [
    {
      name: 'Chrome 34',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',  // Requiere Chrome 34 instalado
      },
    },
  ],
})
```

**Problema**: Playwright no maneja múltiples versiones paralelas fácilmente.

### Usando Selenium Grid (Flexible)

```javascript
// test/selenium/chrome34.test.js
const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

describe('Chrome 34 compatibility', () => {
  let driver

  beforeAll(async () => {
    const service = new chrome.ServiceBuilder(
      './chromedriver' // ChromeDriver 2.9 para Chrome 34
    ).build()

    const options = new chrome.Options()
      .setChromeBinaryPath('./chrome34/chrome.exe') // Ruta a Chrome 34 portable

    driver = new Builder()
      .forBrowser('chrome')
      .setChromeService(service)
      .setChromeOptions(options)
      .build()
  })

  test('Shaka Player carga correctamente', async () => {
    await driver.get('http://localhost:5173')
    // Verificar que el reproductor se inicializa sin errores
    const logs = await driver.manage().logs().get('browser')
    const errors = logs.filter(entry =>
      entry.level.name === 'SEVERE' &&
      entry.message.includes('shaka')
    )
    expect(errors).toHaveLength(0)
  })

  afterAll(async () => {
    await driver.quit()
  })
})
```

### Usando Cypress (con Chrome específico)

```javascript
// cypress.config.js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name === 'chrome') {
          // Especificar ruta a Chrome 34
          launchOptions.executablePath = './chrome34/chrome.exe'
        }
        return launchOptions
      })
    },
  },
})
```

## Script de Validación Local

```bash
#!/bin/bash
# scripts/test-chrome34.sh

# 1. Verificar Chrome 34 portable existe
if [ ! -d "./chrome34" ]; then
  echo "Descargando Chrome 34 portable..."
  # (Implementar descarga desde archivo histórico)
fi

# 2. Iniciar servidor de desarrollo
npm run dev &

# 3. Ejecutar Selenium test
node test/chrome34-compatibility.js

# 4. Reportar resultados
echo "✅ Pruebas Chrome 34 completadas"
```

## Checklist de Compatibilidad

### Features a Verificar en Chrome 34:

| Feature | Chrome 34 | Polyfill Necesario |
|---------|-----------|-------------------|
| MSE (MediaSource) | ✅ (desde 31) | No |
| Promises | ❌ | Sí (core-js) |
| CustomEvent | ⚠️ (31+) | Sí (shaka) |
| Uint8Array | ✅ (23+) | No |
| EME (Widevine) | ❌ (42+) | Solo DRM |
| Fullscreen API | ✅ (21+) | Prefijo? |
| getVideoPlaybackQuality | ⚠️ Prefijo | Sí (shaka) |

### Comportamiento Esperado:

1. **Sin polyfills instalados**: `shaka.Player.isBrowserSupported()` → `false`
2. **Con polyfills**: `isBrowserSupported()` → `true` (si MSE disponible)
3. **Reproducción DASH clear**: ✅ Debería funcionar (sin DRM)
4. **Reproducción DRM**: ❌ Fallará (EME no disponible)

## Depuración en Chrome 34

### Habilitar logs de shaka-player:
```typescript
// Antes de crear el jugador
shaka.log.setLevel(shaka.log.Level.DEBUG)

// Capturar todos los eventos
player.addEventListener('error', (event) => {
  console.error('Shaka error:', event.detail)
})
```

### Consola remota (Remote Debugging):
```bash
# Chrome 34 remote debugging
./chrome34/chrome.exe --remote-debugging-port=9222

# Conectar DevTools:
# chrome://inspect en Chrome moderno → "Configure" → localhost:9222
```

## Si Chrome 34 Falla:

### Fallback a reproductor nativo:
```typescript
if (!shaka.Player.isBrowserSupported()) {
  const video = videoRef.current
  if (video && anime) {
    // Intentar MP4 progresivo si existe
    video.src = anime.streamUrl.replace('.mpd', '.mp4')
    video.controls = true
    video.play()
  }
}
```

### Mensaje para actualizar navegador:
```typescript
const unsupported = () => {
  return `
    <div class="browser-upgrade">
      <h2>Navegador no compatible</h2>
      <p>Para ver este contenido necesitas:</p>
      <ul>
        <li>Chrome 60+ (recomendado)</li>
        <li>Firefox 55+</li>
        <li>Safari 11+</li>
        <li>Edge 79+</li>
      </ul>
      <a href="https://browsehappy.com/">Actualizar navegador</a>
    </div>
  `
}
```

## Automatización CI/CD

### GitHub Actions (usando BrowserStack):
```yaml
name: Browser Compatibility Test
on: [push, pull_request]

jobs:
  test-chrome34:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: BrowserStack Test
        uses: browserstack/github-actions@v1
        with:
          username: ${{ secrets.BROWSERSTACK_USERNAME }}
          access_key: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
          browserstack_local: true
          config_file: browserstack.json
```

### GitHub Actions (local Chrome 34):
```yaml
jobs:
  test-legacy:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Chrome 34
        run: |
          Invoke-WebRequest -Uri "https://.../chrome34.zip" -OutFile "chrome34.zip"
          Expand-Archive -Path chrome34.zip -DestinationPath .
      - name: Run tests with specific Chrome
        run: |
          $env:CHROME_PATH = "$(pwd)/chrome34/chrome.exe"
          npm test
```

## Recursos Adicionales

- **Shaka Player Browser Support Test**: https://shaka-player-demo.appspot.com/support.html
- **Can I use - MSE**: https://caniuse.com/mediasource
- **Can I use - EME**: https://caniuse.com/eme
- **Chrome Platform Status**: httpschromestatus.com/feature/5270704448897024 (MSE)
- **Polyfills ES6**: https://github.com/zloirock/core-js

## Conclusión

**Chrome 28**: ❌ No viable (falta Promises, MSE limitado)
**Chrome 34**: ⚠️ Posible con polyfills intensivos, pero inestable

**Recomendación final**: 
1. Soportar Chrome 60+ oficialmente
2. Para Chrome < 60: reproductor nativo fallback
3. Detectar features, no user-agent

---

**Nota**: Los enlaces a Chrome 34 portable pueden requerir búsqueda en archivos históricos. Google no distribuye versiones antiguas oficialmente.
