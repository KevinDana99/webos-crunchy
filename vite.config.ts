import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import autoprefixer from 'autoprefixer'
import postcssCustomProperties from 'postcss-custom-properties'
import postcssPresetEnv from 'postcss-preset-env'

const webosJsTargets = ['chrome 34']
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
    terserOptions: {
      compress: {
        keep_fnames: true
      },
      mangle: true,
      safari10: true
    }
  }
})
