import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://backend:8000',
      '/products': 'http://backend:8000',
      '/warehouses': 'http://backend:8000',
      '/stock_movements': 'http://backend:8000',
      '/admin': 'http://backend:8000'
    }
  }
})
