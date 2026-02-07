import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Indispensable pour Docker
    port: 5173,       // Port standard
    watch: {
      usePolling: true // Indispensable pour Windows
    }
  }
})