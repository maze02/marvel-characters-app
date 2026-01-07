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
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting for better caching
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Development: no chunking (faster rebuilds), Production: optimized chunks
          manualChunks: isDev
            ? undefined
            : (id) => {
                // Vendor chunk for core React libraries
                if (id.includes("node_modules")) {
                  if (
                    id.includes("react") ||
                    id.includes("react-dom") ||
                    id.includes("react-router")
                  ) {
                    return "vendor";
                  }
                  // Separate chunk for React Query
                  if (id.includes("@tanstack/react-query")) {
                    return "react-query";
                  }
                  // Separate chunk for axios
                  if (id.includes("axios")) {
                    return "axios";
                  }
                  // All other node_modules go into libs
                  return "libs";
                }
              },
          // Optimize asset file names for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split(".");
            const ext = info?.[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? "")) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|ttf|otf|eot/i.test(ext ?? "")) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
      // Enable terser compression options for production
      terserOptions: isDev
        ? undefined
        : {
            compress: {
              drop_console: true, // Remove console.log in production
              drop_debugger: true,
              pure_funcs: ["console.log", "console.info", "console.debug"],
            },
            format: {
              comments: false, // Remove comments
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
        },
      },
    },
    preview: {
      port: 4173,
      headers: {
        // Security headers for production preview (matches vercel.json)
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy":
          "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:; connect-src 'self' https://comicvine.gamespot.com http://localhost:*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      },
    },
  };
});
