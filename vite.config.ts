import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    // Set base path for GitHub Pages deployment
    // Change 'marvel-characters-app' to match your repo name
    base: process.env.GITHUB_PAGES === "true" ? "/marvel-characters-app/" : "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@domain": path.resolve(__dirname, "./src/domain"),
        "@application": path.resolve(__dirname, "./src/application"),
        "@infrastructure": path.resolve(__dirname, "./src/infrastructure"),
        "@ui": path.resolve(__dirname, "./src/ui"),
        "@tests": path.resolve(__dirname, "./src/tests"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@config": path.resolve(__dirname, "./src/config"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@ui/designSystem/tokens/index" as *;`,
          api: "modern-compiler", // Use modern Sass API (sass-embedded)
        },
      },
    },
    build: {
      // Development: no minification, Production: terser minification
      minify: isDev ? false : "terser",
      // Development: inline sourcemaps, Production: no sourcemaps
      sourcemap: isDev ? "inline" : false,
      rollupOptions: {
        output: {
          // Development: no chunking (faster rebuilds), Production: optimized chunks
          manualChunks: isDev
            ? undefined
            : {
                vendor: ["react", "react-dom", "react-router-dom"],
                axios: ["axios"],
              },
        },
      },
    },
    server: {
      open: true, // Auto-open browser in dev mode
      proxy: {
        // Proxy /api/* to Comic Vine API to avoid CORS
        "/api": {
          target: "https://comicvine.gamespot.com",
          changeOrigin: true,
          rewrite: (path) => path, // Keep the /api prefix as-is
          secure: false,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              console.log("[Vite Proxy]", req.method, req.url);
            });
          },
        },
      },
    },
  };
});
