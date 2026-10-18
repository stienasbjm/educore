import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => ({
  base: "/educore/",
  plugins: [react()],
  build: {
    outDir: "docs",
  },
}));
