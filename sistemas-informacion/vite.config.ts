/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Las ilustraciones SVG se emiten como archivos (con caché y carga bajo
    // demanda) en vez de incrustarse en el JavaScript como data: URLs.
    assetsInlineLimit: (filePath) => (filePath.endsWith('.svg') ? false : undefined),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    testTimeout: 30000,
  },
})
