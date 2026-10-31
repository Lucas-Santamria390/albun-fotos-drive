import { describe, it, expect } from "vitest";
import { normalizarOrigen, resolverOrigen } from "../src/lib/origen";

describe("normalizarOrigen", () => {
  it("acepta http y https", () => {
    expect(normalizarOrigen("http://localhost:4321")).toBe("http://localhost:4321");
    expect(normalizarOrigen("https://mialbumweb.netlify.app")).toBe("https://mialbumweb.netlify.app");
  });

  it("quita barras finales y espacios", () => {
    expect(normalizarOrigen("  https://album.example///  ")).toBe("https://album.example");
  });

  it("rechaza protocolos no web", () => {
    expect(normalizarOrigen("ftp://album.example")).toBe("");
    expect(normalizarOrigen("javascript:alert(1)")).toBe("");
  });

  it("rechaza valores malformados o vacíos", () => {
    expect(normalizarOrigen("ttp://localhost:4321")).toBe("");
    expect(normalizarOrigen("localhost:4321")).toBe("");
    expect(normalizarOrigen("")).toBe("");
    expect(normalizarOrigen(null)).toBe("");
    expect(normalizarOrigen(undefined)).toBe("");
  });
});

describe("resolverOrigen", () => {
  it("prioriza la variable de entorno", () => {
    expect(resolverOrigen("https://env.example", "http://localhost:4321")).toBe("https://env.example");
  });

  it("cae al origen del navegador si la variable falta o es inválida", () => {
    expect(resolverOrigen(undefined, "http://localhost:4321")).toBe("http://localhost:4321");
    expect(resolverOrigen("", "http://localhost:4321")).toBe("http://localhost:4321");
    expect(resolverOrigen("no-es-url", "http://localhost:4321")).toBe("http://localhost:4321");
  });

  it("nunca devuelve un dominio de producción fijo", () => {
    expect(resolverOrigen(undefined, undefined)).toBe("");
    expect(resolverOrigen(undefined, undefined)).not.toContain("netlify.app");
  });
});
