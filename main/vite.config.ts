import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});