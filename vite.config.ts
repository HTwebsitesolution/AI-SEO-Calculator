import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './src/app',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/.netlify/functions': 'http://localhost:8888',
      '/api': 'http://localhost:8888',
    },
  },
});
