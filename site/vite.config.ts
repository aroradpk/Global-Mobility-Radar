import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  // Generated job exports must never be copied into a deployable bundle.
  publicDir: false,
  server: { host: "127.0.0.1", fs: { allow: [".", "../knowledge"] } },
  build: { target: "es2020", chunkSizeWarningLimit: 1500 },
});
