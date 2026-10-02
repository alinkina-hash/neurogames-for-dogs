import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works under any GitHub Pages sub-path.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Нейроигры для собак',
        short_name: 'Нейроигры',
        description: 'Каталог нейроигр для собак: нюх, память, мышление, самоконтроль',
        lang: 'ru',
        display: 'standalone',
        theme_color: '#2f6f4e',
        background_color: '#f7f5f0',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
