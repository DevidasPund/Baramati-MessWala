import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('html5-qrcode') || id.includes('qrcode.react')) return 'vendor-qr';
            return 'vendor';
          }
          if (id.includes('src/pages/admin')) return 'module-admin';
          if (id.includes('src/pages/customer')) return 'module-customer';
          if (id.includes('src/pages/public')) return 'module-public';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
