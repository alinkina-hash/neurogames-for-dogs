import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `vite build --mode single` produces one self-contained index.html that opens from disk.
  const single = mode === 'single'

  return {
    // Relative base so the build works under any GitHub Pages sub-path.
    base: './',
    publicDir: single ? false : 'public',
    build: { outDir: single ? 'dist-single' : 'dist' },
    plugins: [
      react(),
      single
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
            manifest: {
              name: 'Нейроигры для собак',
              short_name: 'Нейроигры',
              description: 'Каталог нейроигр для собак: нюх, память, мышление, самоконтроль',
              lang: 'ru',
              display: 'standalone',
              theme_color: '#ffb454',
              background_color: '#fff1c9',
              icons: [
                { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                // Full-bleed background with the paw inside the safe zone, so launchers can crop it.
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
          }),
    ],
    test: {
      include: ['src/**/*.test.ts'],
    },
  }
})
