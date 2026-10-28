
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Local development server
  server: {
    port: 5173,
    host: '0.0.0.0',

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Render production preview server
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['soya-care-frontend.onrender.com'],
  },
});

