import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Google sign-in only works from origins registered in Google Cloud,
    // so the dev server always uses this exact port.
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
