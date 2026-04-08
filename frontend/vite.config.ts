import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// GitHub Pages 部署配置
// 如果整个 gomoku-game 仓库部署到 GitHub Pages，base 应该是 '/'
// 如果只有 frontend 子目录部署，需要设置相对路径
export default defineConfig({
  plugins: [vue()],

  // GitHub Pages 配置
  // 方案1：整个仓库部署（推荐）- base: '/'
  // 方案2：frontend 子目录部署 - base: '/frontend/'
  base: process.env.NODE_ENV === 'production' ? '/gomoku-game/' : '/',

  // 构建优化
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia']
        }
      }
    }
  },

  // 服务器配置
  server: {
    port: 3000,
    open: true
  },

  // 预览配置
  preview: {
    port: 3000
  }
});
