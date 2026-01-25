import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: {
        'main/index': path.resolve(__dirname, 'src/main/index.ts'),
        'preload': path.resolve(__dirname, 'src/preload.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron', 'better-sqlite3'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    middlewareMode: false,
    port: 5173,
  },
});
