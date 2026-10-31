import { describe, it, expect } from "vitest";

const DOMINIO_FIJO = "mialbumweb.netlify.app";

// Vite carga el contenido de los fuentes en tiempo de test: así no hacen falta
// tipos de Node ni tocar el sistema de archivos.
const fuentes = import.meta.glob("../src/**/*.{ts,svelte,astro}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("origen del sitio", () => {
  it("src/ no hardcodea el dominio de producción", () => {
    const conDominio = Object.entries(fuentes)
      .filter(([, contenido]) => contenido.includes(DOMINIO_FIJO))
      .map(([ruta]) => ruta);

    expect(conDominio).toEqual([]);
  });
});
