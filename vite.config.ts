import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import autoprefixer from 'autoprefixer'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssPresetEnv from 'postcss-preset-env'

const webosJsTargets = ['chrome 34']
// webOS 1.x identifies close to Chrome 34, but its WebKit CSS support is closer
// to older prefixed Chrome for flexbox and related layout properties.
const webosCssPrefixTargets = ['chrome 28', 'chrome 34']

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      targets: webosJsTargets,
      renderLegacyChunks: true,
      modernPolyfills: false,
      polyfills: true
    })
  ],
  css: {
    transformer: 'postcss',
    postcss: {
      plugins: [
        // 1. Reemplaza variables por valores (Chrome 34 no entiende variables CSS)
        postcssCustomProperties({
          preserve: false
        }),
        // 2. Transpila CSS moderno (esto incluye el parche para 'gap' en Flexbox)
        postcssPresetEnv({
          stage: 0,
          browsers: webosCssPrefixTargets,
          features: {
            'custom-properties': false,
            'gap-properties': true // Activa el polyfill para el espacio entre elementos
          }
        }),
        // 3. Agrega los prefijos -webkit- obligatorios
        autoprefixer({
          overrideBrowserslist: webosCssPrefixTargets,
          flexbox: true,
          grid: 'autoplace',
          // Evita que el plugin borre prefijos que ya existan o que considere "obsoletos"
          remove: false,
          add: true
        })
      ]
    }
  },
  build: {
    cssTarget: 'chrome34',
    minify: 'terser', // Terser no borra los prefijos como lo hace esbuild
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        // Evita que Terser elimine propiedades que parecen "duplicadas" (como los prefijos)
        keep_fnames: true
      },
      mangle: true,
      safari10: true
    }
  }
})
