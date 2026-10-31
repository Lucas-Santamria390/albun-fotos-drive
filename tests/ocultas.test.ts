import { describe, it, expect } from "vitest";
import {
  agregarOcultas,
  filtrarOcultas,
  leerOcultas,
  serializarOcultas,
} from "../src/lib/services/ocultas";

const fotos = [
  { id: "f1", name: "una.jpg" },
  { id: "f2", name: "dos.jpg" },
  { id: "f3", name: "tres.jpg" },
];

describe("leerOcultas", () => {
  it("devuelve lista vacía si no hay contenido", () => {
    expect(leerOcultas(null)).toEqual([]);
    expect(leerOcultas(undefined)).toEqual([]);
    expect(leerOcultas("")).toEqual([]);
    expect(leerOcultas("   ")).toEqual([]);
  });

  it("tolera JSON corrupto o con forma inesperada", () => {
    expect(leerOcultas("{no es json")).toEqual([]);
    expect(leerOcultas("null")).toEqual([]);
    expect(leerOcultas('{"otra":"cosa"}')).toEqual([]);
    expect(leerOcultas('{"ocultas":"f1"}')).toEqual([]);
  });

  it("acepta la forma { ocultas: [...] } y un array directo", () => {
    expect(leerOcultas('{"ocultas":["f1","f2"]}')).toEqual(["f1", "f2"]);
    expect(leerOcultas('["f1","f2"]')).toEqual(["f1", "f2"]);
  });

  it("recorta, descarta vacíos y elimina duplicados", () => {
    expect(leerOcultas('{"ocultas":[" f1 ","f1","", 2, null, "f2"]}')).toEqual(["f1", "f2"]);
  });
});

describe("agregarOcultas", () => {
  it("añade ids nuevos al final", () => {
    expect(agregarOcultas(["f1"], ["f2"])).toEqual(["f1", "f2"]);
  });

  it("no duplica ids ya presentes", () => {
    expect(agregarOcultas(["f1", "f2"], ["f2", "f3"])).toEqual(["f1", "f2", "f3"]);
  });

  it("tolera listas nulas o ids vacíos", () => {
    expect(agregarOcultas(null, ["f1", "", "  "])).toEqual(["f1"]);
    expect(agregarOcultas(["f1"], null)).toEqual(["f1"]);
  });

  it("no modifica la lista original", () => {
    const original = ["f1"];
    agregarOcultas(original, ["f2"]);
    expect(original).toEqual(["f1"]);
  });
});

describe("serializarOcultas", () => {
  it("envuelve la lista en la forma que espera ocultas.json", () => {
    expect(serializarOcultas(["f1", "f1", "f2"])).toEqual({ ocultas: ["f1", "f2"] });
  });

  it("produce un JSON que leerOcultas entiende", () => {
    const crudo = JSON.stringify(serializarOcultas(["f1", "f2"]));
    expect(leerOcultas(crudo)).toEqual(["f1", "f2"]);
  });
});

describe("filtrarOcultas", () => {
  it("quita de la galería las fotos ocultas", () => {
    expect(filtrarOcultas(fotos, ["f2"]).map((f) => f.id)).toEqual(["f1", "f3"]);
  });

  it("devuelve la misma lista si no hay ocultas", () => {
    expect(filtrarOcultas(fotos, [])).toBe(fotos);
    expect(filtrarOcultas(fotos, null)).toBe(fotos);
    expect(filtrarOcultas(null, ["f1"])).toEqual([]);
  });

  it("no se confunde con ids que no existen", () => {
    expect(filtrarOcultas(fotos, ["otra"])).toHaveLength(3);
  });
});
