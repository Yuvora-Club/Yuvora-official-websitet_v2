import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Custom apex domain (e.g. yuvora.org) serves from root,
  // so base must be '/'. (Project pages needed '/repo-name/'.)
  base: '/',
})
