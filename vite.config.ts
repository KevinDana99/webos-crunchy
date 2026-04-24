import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import autoprefixer from 'autoprefixer'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssPresetEnv from 'postcss-preset-env'

const webosJsTargets = ['chrome 28']
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
        postcssCustomProperties({
          preserve: false
        }),
        postcssPresetEnv({
          stage: 0,
          browsers: webosCssPrefixTargets,
          features: {
            'custom-properties': false,
            'gap-properties': true
          }
        }),
        autoprefixer({
          overrideBrowserslist: webosCssPrefixTargets,
          flexbox: true,
          grid: 'autoplace',
          remove: false,
          add: true
        })
      ]
    }
  },
  build: {
    cssTarget: 'chrome34',
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: true, // Enable source maps for debugging
    terserOptions: {
      compress: {
        keep_fnames: true
      },
      mangle: true,
      safari10: true
    },
    rollupOptions: {
      output: {
        // Nombres fijos para archivos legacy (sin hash)
        entryFileNames: (chunkInfo) => {
          // Para el legacy chunk y los polyfills, usar nombre fijo
          if (chunkInfo.name && (chunkInfo.name.includes('legacy') || chunkInfo.name.includes('polyfills'))) {
            return '[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: (chunkInfo) => {
          // Shaka y Eruda mantener nombre fijo para carga por <script>
          if (chunkInfo.name && (chunkInfo.name.includes('shaka') || chunkInfo.name.includes('eruda'))) {
            return '[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
