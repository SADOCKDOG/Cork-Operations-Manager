import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'www',
    emptyOutDir: false, // Esto limpiará la carpeta www antes de cada build
  },
  server: {
    port: 3000,
  }
});
