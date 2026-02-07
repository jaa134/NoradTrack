import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  publicDir: resolve(__dirname, 'src/public'),
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
});
