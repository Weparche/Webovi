import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // ↓ DODAJ OVO (točno ime ili wildcard domena)
    // allowedHosts: ["unto-casting-stan-shareholders.trycloudflare.com/"],
  allowedHosts: [".trycloudflare.com"]
  },
  preview: { port: 5174 },
  resolve: { alias: { "@": "/src" } },
});