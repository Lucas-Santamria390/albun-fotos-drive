import { describe, it, expect } from "vitest";
import { filtrarOrdenar, estiloConteo } from "../js/services/galeria.js";

const fotos = [
  { id: "a", name: "Nica", createdTime: "2024-01-02T00:00:00Z" },
  { id: "b", name: "Alba", createdTime: "2024-01-03T00:00:00Z" },
  { id: "c", name: "Beta", createdTime: "2024-01-01T00:00:00Z" }
];

describe("galería: filtro y orden", () => {
  it("por defecto ordena de más reciente a más antigua", () => {
    const res = filtrarOrdenar(fotos, "", "recientes");
    expect(res.map((f) => f.id)).toEqual(["b", "a", "c"]);
  });

  it("orden antiguas primero", () => {
    const res = filtrarOrdenar(fotos, "", "antiguos");
    expect(res.map((f) => f.id)).toEqual(["c", "a", "b"]);
  });

  it("orden alfabético", () => {
    const res = filtrarOrdenar(fotos, "", "nombre");
    expect(res.map((f) => f.id)).toEqual(["b", "c", "a"]);
  });

  it("filtra por término de búsqueda (sin importar mayúsculas)", () => {
    const res = filtrarOrdenar(fotos, "ALB", "recientes");
    expect(res.map((f) => f.id)).toEqual(["b"]);
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
    expect(filtrarOrdenar([{ id: "x" }], "", "recientes")).toHaveLength(1);
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