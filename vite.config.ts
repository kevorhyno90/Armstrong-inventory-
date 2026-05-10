import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Armstrong Garage Management',
          short_name: 'Armstrong',
          description: 'Premium Garage & Inventory Management System',
          theme_color: '#0f172a',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'https://api.dicebear.com/9.x/initials/png?seed=Armstrong&backgroundColor=0f172a&fontSize=40&fontWeight=800',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://api.dicebear.com/9.x/initials/png?seed=Armstrong&backgroundColor=0f172a&fontSize=40&fontWeight=800',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://api.dicebear.com/9.x/initials/png?seed=Armstrong&backgroundColor=0f172a&fontSize=40&fontWeight=800',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
