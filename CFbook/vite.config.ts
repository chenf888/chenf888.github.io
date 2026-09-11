import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'node:path'

// CFbook 部署在 chenf888.github.io 的 /CFbook/ 子路径下。
// 所有预置资源（novels/texts、novels/covers）必须通过 BASE_URL 拼接，
// 禁止硬编码 /novels/...。
const BASE = '/CFbook/'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? BASE : '/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'src/novels/texts/*.txt', dest: 'novels/texts' },
        { src: 'src/novels/covers/*', dest: 'novels/covers' },
      ],
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { host: true },
})