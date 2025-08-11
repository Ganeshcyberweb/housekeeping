import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/housekeeping/",   // <-- required for GitHub Pages project site
  plugins: [react(), tailwindcss()],
});
