import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { VitePWA } from 'vite-plugin-pwa';

// 15 locales for internationalization
const locales = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi', 'bn', 'id', 'tr', 'vi'];

// https://astro.build/config
export default defineConfig({
  i18n: {
    locales,
    defaultLocale: 'en',
    prefixDefaultLocale: false,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  output: 'static',
  site: 'https://real-online-ruler.com',
  integrations: [svelte()],
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'Real Online Ruler',
          short_name: 'Ruler',
          description: 'Free online ruler with cm, mm, and inches. Calibrated to your screen\'s physical size.',
          theme_color: '#0066ff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          categories: ['utilities', 'productivity'],
          lang: 'en',
          dir: 'ltr'
        },
        workbox: {
          globPatterns: ['**/*.{html,js,css,png,svg,ico,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ]
  }
});