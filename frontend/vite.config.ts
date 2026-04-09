import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  base: process.env.NODE_ENV === 'production' ? '/gomoku-game/' : '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia']
        }
      }
    }
  },

  server: {
    port: 3000,
    open: true
  },

  preview: {
    port: 3000
  }
});
