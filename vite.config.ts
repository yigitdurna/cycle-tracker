import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/cycle-tracker/',
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'cycle vault',
        short_name: 'cycle vault',
        start_url: '/cycle-tracker/',
        display: 'standalone',
        background_color: '#0A0A0A',
        theme_color: '#0A0A0A',
        orientation: 'portrait',
        icons: [
          { src: 'icon.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
