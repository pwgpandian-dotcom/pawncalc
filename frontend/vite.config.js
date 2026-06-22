import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sri-ayyanar-logo.png', 'apple-touch-icon.png', 'icon-*.png'],
      manifest: {
        name: 'Sri Ayyanar Finance',
        short_name: 'Ayyanar',
        description: 'ஸ்ரீ அய்யனார் பைனான்ஸ் & ஸ்ரீ அம்பாள் டிரேடர்ஸ் — Pawn Broker Finance Management',
        start_url: '/',
        display: 'standalone',
        background_color: '#052e16',
        theme_color: '#16a34a',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon-192.png',          sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png',          sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png',  sizes: '180x180', type: 'image/png' },
        ],
        categories: ['finance', 'business'],
      },
      workbox: {
        // Cache static assets (JS, CSS, fonts, images) — cache first
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
        // Financial data (loans, customers) — always network first, never stale
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'charts':        ['recharts'],
          'pdf':           ['jspdf', 'jspdf-autotable'],
          'excel':         ['xlsx'],
        }
      }
    }
  }
});
