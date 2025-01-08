import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    target: "esnext", // Needed for top-level await
  },
  plugins: [wasm()],
  server: {
    headers: {
      // "Cross-Origin-Opener-Policy": "same-origin",
      // "Cross-Origin-Embedder-Policy": "require-corp",
    },
    // Configura una route API inline
    proxy: {
      "/api": {
        target: "http://localhost:5214", // URL del server API
        changeOrigin: true, // Cambia l'origine della richiesta
      },
    },
  },
});
