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
  ownerEmail?: string;
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
  owners?: Array<{ emailAddress?: string }>;
}

export interface MemoEstructura {
  raiz: string;
  inv: string;
  users: string;
  fotos: string;
  /** id de album.json (vacío en enlaces anteriores a este archivo). */
  album: string;
  /** id de ocultas.json (vacío en enlaces anteriores a este archivo). */
  ocultas?: string;
  /** id de grupos.json (vacío en enlaces anteriores). */
  grupos?: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  fotos: string[];
}

/** Contenido de album.json: nombre visible del álbum. */
export interface AlbumInfo {
  nombre: string;
  dueno?: string;
  creado?: string;
}

/** Álbum recordado en este navegador (localStorage). Nunca guarda el token. */
export interface AlbumGuardado {
  drive: string;
  inv: string;
  users: string;
  fotos: string;
  album?: string;
  /** id de ocultas.json (vacío en enlaces anteriores a este archivo). */
  ocultas?: string;
  grupos?: string;
  nombre: string;
  rol: Rol;
  /** Fecha ISO en la que se unió a este álbum. */
  unido: string;
}

export type OrdenGaleria = "recientes" | "antiguos" | "nombre";

export interface ErrorHttp extends Error {
  code?: number;
  /** Motivo concreto devuelto por Google (p. ej. appNotAuthorizedToFile). */
  reason?: string;
}

export interface PerfilGoogle {
  emailAddress: string;
  displayName?: string;
  photoLink?: string;
}

export type ResultadoValidacion =
  { ok: true; invitacion: Invitacion } | { ok: false; motivo: "invalida" | "expirada" };
