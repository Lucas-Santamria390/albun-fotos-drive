import { describe, it, expect } from "vitest";

// Astro bloquea en `dev` cualquier navegación a un `.html` que exista en la
// raíz del proyecto pero no en `src/` o `public/` (route guard). Un HTML legado
// en la raíz eclipsa la ruta equivalente de `src/pages` y devuelve 404.
const htmlEnRaiz = Object.keys(
  import.meta.glob("../*.html", {
    query: "?raw",
    import: "default",
    eager: true,
  })
);

describe("raíz del proyecto", () => {
  it("no conserva HTML legado que eclipse las rutas de src/pages", () => {
    expect(htmlEnRaiz).toEqual([]);
  });
});
