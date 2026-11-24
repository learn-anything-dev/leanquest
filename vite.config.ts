import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so it works on GitHub Pages under any repo name.
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LeanQuest',
        short_name: 'LeanQuest',
        description: 'Free, offline, bodyweight weight-loss coach',
        theme_color: '#0a0a0a',
        background_color: '#fafaf9',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,json,woff2}'] },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
});
