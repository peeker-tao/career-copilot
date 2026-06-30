import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // 从 backend/ 目录加载 .env（上级目录），实现单点配置
  const env = loadEnv(mode, resolve(__dirname, '..'), '');

  return {
    plugins: [react()],
    envDir: resolve(__dirname, '..'), // 让 import.meta.env 也能读到
    server: {
      port: parseInt(env.VITE_ADMIN_DEV_PORT || '5174', 10),
      proxy: {
        '/api': {
          target: env.VITE_ADMIN_API_URL || 'http://localhost:3002',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
