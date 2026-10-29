import { describe, it, expect } from "vitest";
import { filtrarOrdenar, estiloConteo } from "../src/lib/services/galeria";
import type { Foto } from "../src/lib/tipos";

const fotos: Foto[] = [
  { id: "a", name: "Nica", createdTime: "2024-01-02T00:00:00Z" },
  { id: "b", name: "Alba", createdTime: "2024-01-03T00:00:00Z" },
  { id: "c", name: "Beta", createdTime: "2024-01-01T00:00:00Z" },
];

describe("galería: filtro y orden", () => {
  it("por defecto ordena de más reciente a más antigua", () => {
    expect(filtrarOrdenar(fotos, "", "recientes").map((f) => f.id)).toEqual(["b", "a", "c"]);
  });

  it("orden antiguas primero", () => {
    expect(filtrarOrdenar(fotos, "", "antiguos").map((f) => f.id)).toEqual(["c", "a", "b"]);
  });

  it("orden alfabético", () => {
    expect(filtrarOrdenar(fotos, "", "nombre").map((f) => f.id)).toEqual(["b", "c", "a"]);
  });

  it("filtra por término de búsqueda (sin importar mayúsculas)", () => {
    expect(filtrarOrdenar(fotos, "ALB", "recientes").map((f) => f.id)).toEqual(["b"]);
  });

  it("término sin resultados devuelve lista vacía", () => {
    expect(filtrarOrdenar(fotos, "zzz", "recientes")).toEqual([]);
  });

  it("no muta la lista original", () => {
    const copia = fotos.slice();
    filtrarOrdenar(fotos, "", "antiguos");
    expect(fotos).toEqual(copia);
  });

  it("tolera entradas sin nombre o lista vacía", () => {
    expect(filtrarOrdenar([{ id: "x", name: "" }], "", "recientes")).toHaveLength(1);
    expect(filtrarOrdenar([], "a", "recientes")).toEqual([]);
  });
});

describe("galería: contador", () => {
  it("vacío devuelve cadena vacía", () => {
    expect(estiloConteo(0, 0)).toBe("");
  });

  it("singular y plural", () => {
    expect(estiloConteo(1, 1)).toBe("1 foto");
    expect(estiloConteo(3, 3)).toBe("3 fotos");
  });

  it("parcial indica X de Y", () => {
    expect(estiloConteo(10, 4)).toBe("4 de 10");
  });
});
