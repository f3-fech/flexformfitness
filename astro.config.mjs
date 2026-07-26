import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  server: {
    host: true,
  },
  output: 'static',
  security: {
    actionBodySizeLimit: 15 * 1024 * 1024, // 15 MB
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  integrations: [tailwind(), react()],
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      watch: {
        ignored: ['**/.vercel/**'],
      },
    },
  },
});
