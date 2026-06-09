import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Esto limpiará la carpeta dist antes de cada build
  },
  server: {
    port: 3000,
  }
});
