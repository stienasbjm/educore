import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: "/testakademik/",
  plugins: [react()],
  build: {
    outDir: "docs",
  },
  define: command === "build"
    ? {
        "import.meta.env.VITE_ADMIN_USERNAME": JSON.stringify(""),
        "import.meta.env.VITE_ADMIN_PASSWORD": JSON.stringify(""),
      }
    : undefined,
}));
