import { describe, expect, it } from "vitest";
import { agregarFotosAlGrupo, leerGrupos, quitarFotosDeGrupo, serializarGrupos } from "../src/lib/services/grupos";

describe("grupos", () => {
  it("lee y normaliza grupos válidos", () => {
    expect(leerGrupos('[{"id":"g1","nombre":" Viaje ","fotos":["f1","f1",""]}]')).toEqual([
      { id: "g1", nombre: "Viaje", fotos: ["f1"] },
    ]);
  });

  it("añade fotos sin duplicarlas y las puede quitar", () => {
    const grupo = { id: "g1", nombre: "Viaje", fotos: ["f1"] };
    expect(agregarFotosAlGrupo(grupo, ["f1", "f2"]).fotos).toEqual(["f1", "f2"]);
    expect(quitarFotosDeGrupo(grupo, ["f1"]).fotos).toEqual([]);
  });

  it("serializa con ids únicos", () => {
    expect(serializarGrupos([{ id: "g1", nombre: "Viaje ", fotos: ["f1", "f1"] }])).toEqual([
      { id: "g1", nombre: "Viaje", fotos: ["f1"] },
    ]);
  });
});
