import { describe, it, expect } from "vitest";
import { enlaceInvitacion } from "../src/lib/services/enlaces";
import type { MemoEstructura } from "../src/lib/tipos";

const memo: MemoEstructura = {
  raiz: "fRaiz",
  inv: "fInv",
  users: "fUsers",
  fotos: "fFotos",
};

describe("enlaceInvitacion", () => {
  it("construye el enlace con la URL base del sitio", () => {
    const enlace = enlaceInvitacion("tok123", memo);
    expect(enlace.indexOf("https://mialbumweb.netlify.app/album.html?")).toBe(0);
  });

  it("incluye raíz, token e ids de archivos", () => {
    const enlace = enlaceInvitacion("tok123", memo);
    expect(enlace).toContain("drive=fRaiz");
    expect(enlace).toContain("token=tok123");
    expect(enlace).toContain("inv=fInv");
    expect(enlace).toContain("users=fUsers");
    expect(enlace).toContain("fotos=fFotos");
  });

  it("usa el memo pasado y no uno global", () => {
    const enlace = enlaceInvitacion("x", {
      raiz: "a",
      inv: "b",
      users: "c",
      fotos: "d",
    });
    expect(enlace).toContain("drive=a");
    expect(enlace).not.toContain("drive=fRaiz");
  });

  it("codifica el token si llega sin codificar", () => {
    const enlace = enlaceInvitacion("t o k/1", memo);
    expect(enlace).toContain("token=" + encodeURIComponent("t o k/1"));
    expect(enlace).not.toContain("token=t o k/1");
  });
});
