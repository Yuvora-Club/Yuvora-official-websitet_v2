import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Custom apex domain (e.g. yuvora.org) serves from root,
  // so base must be '/'. (Project pages needed '/repo-name/'.)
  base: '/',
  server: {
    // Local dev: forward relative `/api/*` calls to the Backend
    // (http://localhost:4000) to avoid CORS issues. Absolute calls
    // via VITE_API_URL (see src/services/api.js) go direct.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
