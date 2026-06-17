import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    watch: {
      ignored: [
        '**/release/**',
        '**/dist/**',
        '**/*.zip',
        '**/sysconfig.dat'
      ]
    }
  },
});
