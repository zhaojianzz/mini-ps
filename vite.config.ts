import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import Unocss from 'unocss/vite'
import { chunkSplitPlugin } from "vite-plugin-chunk-split";
import checker from "vite-plugin-checker";
import viteCompression from "vite-plugin-compression";
import legacy from "@vitejs/plugin-legacy";
// https://vitejs.dev/config/
const BUILD_VSL = process.env.BUILD_VSL !== undefined;
const filter = /\.(js|css|json|txt|html|ico|svg|ttf|eot|woff)(\?.*)?$/i
export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: resolve('./src/components/components.d.ts'),
      resolvers: [ ElementPlusResolver() ]
    }),
    BUILD_VSL && visualizer({
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
    Unocss(resolve(__dirname, './uno.config.ts')),
    chunkSplitPlugin(),
    {
      ...checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{vue,js,mjs,cjs,jsx,ts,tsx}"',
          dev: {
            logLevel: ["error"],
          },
        },
      }),
      apply: "serve",
    },
    viteCompression({
      filter,
      threshold: 10240
    }),
    legacy({
      ignoreBrowserslistConfig: true,
      targets: ["ie >= 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    })
  ],
  resolve: {
    alias:{
      "@": resolve(__dirname, 'src'),
      "@c": resolve(__dirname, 'src/components')
    }
  },
  build: {
    target: ['es2015']
  }
})
