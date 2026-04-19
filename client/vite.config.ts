import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Warn if any single chunk exceeds 500kb gzipped-ish
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual vendor chunks so rarely-changing library code can be cached
        // independently from app code. Each group ships as its own file and
        // won't bust the cache when we edit components.
        manualChunks: {
          // Core framework — changes rarely, long-lived cache
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-forms': ['react-hot-toast'],
          // Heavy feature libs — isolated so other pages don't pay their cost
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-underline',
            '@tiptap/extension-color',
            '@tiptap/extension-text-style',
            '@tiptap/extension-highlight',
            '@tiptap/extension-text-align',
            '@tiptap/extension-character-count',
            '@tiptap/extension-image',
            '@tiptap/extension-bubble-menu',
          ],
          'vendor-charts': ['recharts'],
          'vendor-socket': ['socket.io-client'],
          'vendor-pageflip': ['react-pageflip'],
        },
      },
    },
  },
});
