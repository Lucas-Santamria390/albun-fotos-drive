/** Tipos del dominio. Las claves se mantienen en español (ver AGENTS.md). */

export type Rol = "admin" | "colaborador" | "visitante";

export interface Permisos {
  subir: boolean;
  borrar: boolean;
  modificar: boolean;
}

export interface Usuario {
  nombre?: string;
  rol: Rol;
  permisos: Permisos;
}

export type Usuarios = Record<string, Usuario>;

export interface Invitacion {
  rol: Rol;
  permisos: Permisos;
  /** "indefinida" o una fecha ISO corta (YYYY-MM-DD). */
  expiracion: string;
}

export type Invitaciones = Record<string, Invitacion>;

export interface Foto {
  id: string;
  name: string;
  size?: string;
  createdTime?: string;
  mimeType?: string;
  thumbnailLink?: string;
}

/** Archivo tal como lo devuelve la API de Drive. */
export interface ArchivoDrive {
  id: string;
  name?: string;
  mimeType?: string;
  createdTime?: string;
  size?: string;
  thumbnailLink?: string;
}

export interface MemoEstructura {
  raiz: string;
  inv: string;
  users: string;
  fotos: string;
}

export type OrdenGaleria = "recientes" | "antiguos" | "nombre";

export interface ErrorHttp extends Error {
  code?: number;
}

export interface PerfilGoogle {
  emailAddress: string;
  displayName?: string;
  photoLink?: string;
}

export type ResultadoValidacion =
  | { ok: true; invitacion: Invitacion }
  | { ok: false; motivo: "invalida" | "expirada" };
