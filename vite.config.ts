import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Phase 5 — Performance : split vendors en chunks pour améliorer le cache HTTP.
// Phase 8 — PWA : vite-plugin-pwa (generateSW) pour installabilité + offline.
// L'enregistrement du SW reste piloté par notre wrapper (voir
// src/lib/pwa/serviceWorkerRegistration.ts) → injectRegister: false.
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: false,
      filename: "sw.js",
      manifest: false, // on garde public/manifest.webmanifest existant
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
      ],
      devOptions: { enabled: false },
      workbox: {
        sourcemap: false,
        // LOT 14.2 — handlers `push` / `notificationclick` (aucun impact cache).
        importScripts: ["/push-sw.js"],
        cleanupOutdatedCaches: true,

        clientsClaim: true,
        // MAJ jamais silencieuse : le nouveau SW est activé au rechargement
        // demandé explicitement par l'utilisateur (PWAUpdatePrompt).
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2,ttf}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/functions\//,
          /^\/~oauth/,
          /^\/auth\/v1\//,
          /^\/rest\/v1\//,
          /^\/storage\/v1\//,
          /^\/realtime\/v1\//,
          /^\/sw\.js$/,
        ],
        runtimeCaching: [
          // 1. Navigation HTML : NetworkFirst (jamais de HTML périmé)
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "ltpc-html",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          // 2. Assets JS/CSS hashés : CacheFirst
          {
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && (request.destination === "script" || request.destination === "style"),
            handler: "CacheFirst",
            options: {
              cacheName: "ltpc-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // 3. Fonts
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "ltpc-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          // 4. Images
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "ltpc-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          // 5. Manifest / icônes
          {
            urlPattern: /\/(manifest\.webmanifest|icon-.*\.png|apple-touch-icon\.png)$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "ltpc-manifest" },
          },
          // 6. Supabase Storage (logos, signatures, PDF récents) — SWR court
          {
            urlPattern: /\/storage\/v1\/object\/(public|sign)\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "ltpc-storage",
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 7. API REST Supabase — NetworkFirst court, sert de fallback lecture offline
          {
            urlPattern: /\/rest\/v1\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "ltpc-api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // NB: /auth/v1, /functions/v1, /realtime/v1 → jamais cachés (secrets/temps réel)
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // ⚠️ Ne PAS séparer react/react-dom des libs qui en dépendent :
        // le découpage manuel créait un cycle d'initialisation entre chunks
        // (React undefined → "Cannot read properties of undefined (reading
        // 'createContext')" en production). On isole uniquement des libs
        // lourdes et sans dépendance croisée avec l'écosystème React.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-tiptap";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
          if (id.includes("date-fns")) return "vendor-date";
          return undefined;
        },
      },
    },

  },
}));
