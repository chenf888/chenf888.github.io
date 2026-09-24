import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// 部署到 GitHub Pages 子路径时通过 VITE_BASE=/CFword/ 指定。
// 本地开发默认使用根路径。
const BASE = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base: BASE,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'CFword',
        short_name: 'CFword',
        description: 'Local-First 纯前端背单词应用',
        theme_color: '#2563eb',
        background_color: '#f7f8fa',
        display: 'standalone',
        lang: 'zh-CN',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,woff2,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/index\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'deck-index' },
          },
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'word-data',
              expiration: { maxEntries: 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { host: true },
})