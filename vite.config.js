import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // accessible depuis un téléphone sur le même réseau Wi-Fi
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
