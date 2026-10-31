import { describe, it, expect } from "vitest";
import { SCOPE, SCOPE_DUENO, SCOPE_INVITADO, scopeDelModo } from "../src/lib/config";

describe("configuración de scopes", () => {
  it("usa un único scope con acceso a los archivos compartidos", () => {
    expect(SCOPE).toBe("https://www.googleapis.com/auth/drive");
    expect(SCOPE_DUENO).toBe(SCOPE);
    expect(SCOPE_INVITADO).toBe(SCOPE);
  });

  it("el modo no cambia el scope: evita re-login innecesario", () => {
    expect(scopeDelModo("owner")).toBe(SCOPE);
    expect(scopeDelModo("inv")).toBe(SCOPE);
  });
});
