import { describe, it, expect } from "vitest";
import { mensajeAccesoAlbum } from "../src/lib/services/errores";
import type { ErrorHttp } from "../src/lib/tipos";

function error(mensaje: string, code?: number, reason?: string): ErrorHttp {
  const e = new Error(mensaje) as ErrorHttp;
  if (code !== undefined) e.code = code;
  if (reason) e.reason = reason;
  return e;
}

describe("mensajeAccesoAlbum", () => {
  it("traduce la sesión expirada", () => {
    expect(mensajeAccesoAlbum(error("cualquiera", 401))).toContain("sesión expiró");
  });

  it("explica la falta de permiso de app en Drive", () => {
    expect(mensajeAccesoAlbum(error("no", 403, "appNotAuthorizedToFile"))).toContain("acceso de app");
    expect(mensajeAccesoAlbum(error("no", 403))).toContain("acceso de app");
  });

  it("distingue archivos no encontrados", () => {
    expect(mensajeAccesoAlbum(error("no", 404))).toContain("No se pudieron encontrar");
  });

  it("conserva el mensaje original como último recurso", () => {
    expect(mensajeAccesoAlbum(error("Error de red", 500))).toBe("Error de red");
  });
});
