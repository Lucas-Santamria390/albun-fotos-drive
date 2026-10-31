import { describe, it, expect } from "vitest";
import { qrSvg, qrDataUrl } from "../src/lib/qr";

const enlace = "http://localhost:4321/album.html?token=alb-test";

describe("qr local", () => {
  it("genera un SVG válido", () => {
    const svg = qrSvg(enlace);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
    expect(svg).not.toContain("<script");
  });

  it("genera una data URL segura", () => {
    const url = qrDataUrl(enlace);
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(url).not.toContain("http://");
  });

  it("no depende de servicios externos", () => {
    expect(qrSvg(enlace)).not.toContain("qrserver");
  });
});
