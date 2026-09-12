import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'node:path'

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