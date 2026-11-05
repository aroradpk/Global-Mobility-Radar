import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH is set by the deploy workflow when the site lives under a subpath.
// In dev, /api goes to the local Worker (`wrangler dev` on 8787); production
// builds set VITE_API_URL to the deployed API instead.
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  server: { fs: { allow: [".."] }, proxy: { "/api": "http://localhost:8787" } },
  build: { target: "es2020", chunkSizeWarningLimit: 1500 },
});
