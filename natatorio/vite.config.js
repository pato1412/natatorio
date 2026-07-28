import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/favicon.png",
        "icons/favicon-16.png",
        "icons/apple-touch-icon.png",
        "logo-full.png",
        "logo-mark.png",
      ],
      manifest: {
        name: "Aqua Metrics",
        short_name: "Aqua Metrics",
        description: "Aqua Metrics — Medí tu rendimiento. Cronometraje y seguimiento de tiempos de natación para profesores y atletas",
        start_url: "/",
        scope: "/",
        id: "/",
        display: "standalone",
        background_color: "#071c2c",
        theme_color: "#071c2c",
        orientation: "portrait-primary",
        lang: "es",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // La app depende de Firestore en tiempo real; el service worker solo
        // cachea el "app shell" (JS/CSS/HTML/íconos) para que cargue rápido
        // y funcione la instalación, no los datos.
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
