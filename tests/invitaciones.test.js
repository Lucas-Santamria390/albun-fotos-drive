import { describe, it, expect } from "vitest";
import {
  generarToken,
  invitacionExpirada,
  permisosSegunRol,
  validarInvitacion
} from "../js/services/invitaciones.js";

const colaborador = {
  rol: "colaborador",
  permisos: { subir: true, borrar: false, modificar: false },
  expiracion: "indefinida"
};

describe("invitaciones", () => {
  it("genera tokens únicos con formato alb-...", () => {
    const a = generarToken();
    const b = generarToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^alb-[a-z0-9]+-[a-z0-9]{4,}$/);
    expect(b).toMatch(/^alb-/);
  });

  it("una invitación indefinida nunca expira", () => {
    expect(invitacionExpirada(colaborador, new Date("2099-01-01"))).toBe(false);
  });

  it("una invitación con fecha pasada está expirada", () => {
    const vencida = { ...colaborador, expiracion: "2020-01-01" };
    expect(invitacionExpirada(vencida, new Date("2024-01-01"))).toBe(true);
  });

  it("una invitación con fecha futura no expira", () => {
    const vigente = { ...colaborador, expiracion: "2030-01-01" };
    expect(invitacionExpirada(vigente, new Date("2024-01-01"))).toBe(false);
  });

  it("expirada con undefined devuelve false", () => {
    expect(invitacionExpirada(undefined)).toBe(false);
  });

  it("validarInvitacion acepta una invitación válida", () => {
    const res = validarInvitacion({ token1: colaborador }, "token1");
    expect(res.ok).toBe(true);
    expect(res.invitacion.rol).toBe("colaborador");
  });

  it("validarInvitacion rechaza un token inexistente", () => {
    const res = validarInvitacion({ token1: colaborador }, "x");
    expect(res.ok).toBe(false);
    expect(res.motivo).toBe("invalida");
  });

  it("validarInvitacion detecta expiración", () => {
    const vencida = { ...colaborador, expiracion: "2020-01-01" };
    const res = validarInvitacion({ token1: vencida }, "token1", new Date("2024-01-01"));
    expect(res.ok).toBe(false);
    expect(res.motivo).toBe("expirada");
  });

  it("permisosSegunRol usa los permisos de la invitación o el valor por defecto", () => {
    expect(permisosSegunRol(colaborador).borrar).toBe(false);
    expect(permisosSegunRol(undefined)).toEqual({ subir: true, borrar: false, modificar: false });
  });
});