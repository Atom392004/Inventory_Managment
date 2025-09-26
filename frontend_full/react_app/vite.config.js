
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/products': 'http://localhost:8000',
      '/warehouses': 'http://localhost:8000',
      '/stock_movements': 'http://localhost:8000',
      '/admin': 'http://localhost:8000'
    }
  }
})
