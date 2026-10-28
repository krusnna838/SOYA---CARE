import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Local development only. On Render, the frontend calls the deployed API URL
  // configured through VITE_API_BASE_URL instead of localhost.
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Vite preview is used by the current Render Web Service setup.
  preview: {
    host: '0.0.0.0',
    port: 10000,
    strictPort: false,
    allowedHosts: ['.onrender.com'],
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
