import { describe, it, expect } from "vitest";
import {
  puede,
  puedeSubir,
  puedeBorrar,
  PERMISOS_INICIALES,
  PERMISOS_ADMIN,
  PERMISOS_VISITANTE
} from "../js/services/permisos.js";

describe("permisos", () => {
  it("colaborador inicial puede subir pero no borrar", () => {
    expect(puedeSubir(PERMISOS_INICIALES)).toBe(true);
    expect(puedeBorrar(PERMISOS_INICIALES)).toBe(false);
  });

  it("admin puede subir y borrar", () => {
    expect(puedeSubir(PERMISOS_ADMIN)).toBe(true);
    expect(puedeBorrar(PERMISOS_ADMIN)).toBe(true);
  });

  it("visitante no puede subir ni borrar", () => {
    expect(puedeSubir(PERMISOS_VISITANTE)).toBe(false);
    expect(puedeBorrar(PERMISOS_VISITANTE)).toBe(false);
  });

  it("puede devuelve false con permisos nulos", () => {
    expect(puede(null, "subir")).toBe(false);
    expect(puede(undefined, "borrar")).toBe(false);
  });

  it("no muta los objetos de permisos", () => {
    expect(PERMISOS_ADMIN).toEqual({ subir: true, borrar: true, modificar: true });
  });
});