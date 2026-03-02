import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          maps: ['mapbox-gl'],
          realtime: ['socket.io-client'],
          routing: ['react-router-dom'],
          http: ['axios'],
        },
      },
    },
  },
})
