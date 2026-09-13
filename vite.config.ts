import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@mui/') || id.includes('@emotion/')) return 'mui';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@firebase/auth') || id.includes('/firebase/auth')) return 'firebase-auth';
          if (id.includes('@firebase/firestore') || id.includes('/firebase/firestore')) return 'firebase-firestore';
          if (id.includes('@firebase/storage') || id.includes('/firebase/storage')) return 'firebase-storage';
          if (id.includes('@firebase/') || id.includes('/firebase/')) return 'firebase-core';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
