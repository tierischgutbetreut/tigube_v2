import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
});
