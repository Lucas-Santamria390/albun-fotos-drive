import { describe, it, expect } from "vitest";
import { enlaceInvitacion } from "../src/lib/services/enlaces";
import type { MemoEstructura } from "../src/lib/tipos";

const memo: MemoEstructura = {
  raiz: "fRaiz",
  inv: "fInv",
  users: "fUsers",
  fotos: "fFotos",
  album: "fAlbum",
};

describe("enlaceInvitacion", () => {
  it("usa el origen recibido, no un dominio fijo", () => {
    const enlace = enlaceInvitacion("tok123", memo, "http://localhost:4321");
    expect(enlace.startsWith("http://localhost:4321/album.html?")).toBe(true);
    expect(enlace).not.toContain("mialbumweb.netlify.app");
  });

  it("funciona con el origen de un deploy preview", () => {
    const enlace = enlaceInvitacion("tok123", memo, "https://rama--mialbumweb.netlify.app");
    expect(enlace.startsWith("https://rama--mialbumweb.netlify.app/album.html?")).toBe(true);
  });

  it("incluye raíz, token e ids de archivos", () => {
    const enlace = enlaceInvitacion("tok123", memo, "https://album.example");
    expect(enlace).toContain("drive=fRaiz");
    expect(enlace).toContain("token=tok123");
    expect(enlace).toContain("inv=fInv");
    expect(enlace).toContain("users=fUsers");
    expect(enlace).toContain("fotos=fFotos");
  });

  it("usa el memo pasado y no uno global", () => {
    const enlace = enlaceInvitacion(
      "x",
      { raiz: "a", inv: "b", users: "c", fotos: "d", album: "" },
      "https://album.example"
    );
    expect(enlace).toContain("drive=a");
    expect(enlace).toContain("inv=b");
    expect(enlace).toContain("users=c");
    expect(enlace).toContain("fotos=d");
  });

  it("incluye el id de album.json cuando existe", () => {
    const enlace = enlaceInvitacion("tok", memo, "https://album.example");
    expect(enlace).toContain("album=fAlbum");
  });

  it("omite album cuando el memo no lo tiene (enlaces antiguos)", () => {
    const enlace = enlaceInvitacion(
      "tok",
      { raiz: "a", inv: "b", users: "c", fotos: "d", album: "" },
      "https://album.example"
    );
    expect(enlace).not.toContain("album=");
  });

  it("codifica el token exactamente una vez", () => {
    const token = "t o k/1&x=2";
    const enlace = enlaceInvitacion(token, memo, "https://album.example");
    const url = new URL(enlace);
    expect(url.searchParams.get("token")).toBe(token);
    expect(enlace).toContain("token=t+o+k%2F1%26x%3D2");
    expect(enlace).not.toContain("%252F");
  });

  it("normaliza la barra final del origen", () => {
    const enlace = enlaceInvitacion("tok", memo, "https://album.example/");
    expect(enlace.startsWith("https://album.example/album.html?")).toBe(true);
  });

  it("rechaza un origen inválido en lugar de inventarlo", () => {
    expect(() => enlaceInvitacion("tok", memo, "ttp://localhost:4321")).toThrow();
    expect(() => enlaceInvitacion("tok", memo, "")).toThrow();
  });
});
