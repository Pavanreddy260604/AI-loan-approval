import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || "http://gateway-service:4000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    hmr: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
