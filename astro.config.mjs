import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

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
});