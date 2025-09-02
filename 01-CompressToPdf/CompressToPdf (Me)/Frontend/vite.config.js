import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Only include packages you know you have
          'react-vendor': ['react', 'react-dom'],
          // Add other packages only if they're installed
          // 'utils-vendor': ['axios', 'lodash'] // Uncomment if you have these
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})