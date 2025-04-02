import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/pills-tracker/', // Replace with your repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    allowedHosts: ['devserver-main--ecingel.netlify.app']
  }
});
