import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/analyze': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/register': 'http://localhost:8000',
      '/login': 'http://localhost:8000',
      '/games': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/puzzles': 'http://localhost:8000',
    },
  },
})
