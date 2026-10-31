import process from "node:process";
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// `site` es opcional y sale del entorno: sin `PUBLIC_SITE_URL` no se fija
// ningún dominio (ni canonical ni OG), y los enlaces de invitación usan el
// origen real del navegador. `build.format: "file"` conserva las URLs
// públicas existentes (album.html, ajustes.html).
const site = process.env.PUBLIC_SITE_URL?.trim() || undefined;

export default defineConfig({
  ...(site ? { site } : {}),
  build: { format: "file" },
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
