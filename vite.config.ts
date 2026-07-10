import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Phase 5 — Performance : split vendors en chunks pour améliorer le cache HTTP,
// permettre au navigateur de charger uniquement le nécessaire et accélérer
// les navigations. Ne change AUCUN comportement runtime.
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || id.includes("scheduler") || /node_modules\/react\//.test(id)) return "vendor-react";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@tanstack/react-query")) return "vendor-query";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-tiptap";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "vendor-pdf";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("date-fns")) return "vendor-date";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("zod") || id.includes("react-hook-form") || id.includes("@hookform")) return "vendor-forms";
          return "vendor";
        },
      },
    },
  },
}));
