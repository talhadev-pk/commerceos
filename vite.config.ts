import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: https://talhadev-pk.github.io/commerceos/
// HashRouter is used in the app so every deep link works without server rewrites.
export default defineConfig({
  base: '/commerceos/',
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  build: { chunkSizeWarningLimit: 1200 },
})
