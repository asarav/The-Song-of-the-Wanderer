import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const alias = {
  '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
  '@content': fileURLToPath(new URL('./src/content', import.meta.url)),
  '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
  '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  test: {
    environment: 'node',
    // Every test file runs in its own worker and the content-heavy ones validate the whole
    // pack on their first test. With ~48 workers starting at once that cold load passes the
    // 5 s default on a busy machine (three suite tests flaked this way); 15 s leaves the
    // assertion failing promptly without failing the load.
    testTimeout: 15_000,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tools/**/*.test.ts'],
    coverage: {
      include: ['src/engine/**'],
    },
  },
})
