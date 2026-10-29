import { describe, it, expect } from "vitest";
import { escapeHtml, inicial } from "../src/lib/services/texto";

describe("escapeHtml", () => {
  it("escapa caracteres peligrosos", () => {
    expect(escapeHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });

  it("escapa comillas dobles y ampersand", () => {
    expect(escapeHtml('a"b&c')).toBe("a&quot;b&amp;c");
  });

  it("devuelve cadena vacía para null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("no altera texto normal", () => {
    expect(escapeHtml("playa y sol")).toBe("playa y sol");
  });
});

describe("inicial", () => {
  it("devuelve la primera letra en mayúscula", () => {
    expect(inicial("lucas")).toBe("L");
    expect(inicial("  álvaro ")).toBe("Á");
  });

  it("tolera valores vacíos", () => {
    expect(inicial("")).toBe("");
    expect(inicial(null)).toBe("");
  });
});
