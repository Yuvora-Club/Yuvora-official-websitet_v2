import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages project site:
  // https://Yuvora-Club.github.io/Yuvora-official-websitet_v2/
  base: '/Yuvora-official-websitet_v2/',
})
