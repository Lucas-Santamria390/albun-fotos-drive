import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// `build.format: "file"` conserva las URLs públicas existentes
// (album.html, ajustes.html) para no romper los enlaces de invitación ya emitidos.
export default defineConfig({
  site: "https://mialbumweb.netlify.app",
  build: { format: "file" },
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
