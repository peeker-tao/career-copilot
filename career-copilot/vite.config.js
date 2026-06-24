import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173, // 前端端口
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',  // NestJS后端地址
        changeOrigin: true,
        // 如果后端没有 /api 前缀，需要 rewrite
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
