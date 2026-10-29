import type { MemoEstructura } from "./tipos";

/** Client ID público de Google OAuth (no es un secreto). */
const CLIENT_ID_POR_DEFECTO =
  "622196535234-ddrlisjppqaivef385ncm17jvi22pojk.apps.googleusercontent.com";

const clientIdEnv = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID as string | undefined;

export const CONFIG = {
  clientId: clientIdEnv || CLIENT_ID_POR_DEFECTO,
  scope: "https://www.googleapis.com/auth/drive.file",
  rootNombre: "MiAlbumWeb_Config",
  folderMime: "application/vnd.google-apps.folder",
  jsonMime: "application/json",
  mimeImagen: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/heic",
  ] as string[],
  apiBase: "https://www.googleapis.com/drive/v3",
  uploadBase: "https://www.googleapis.com/upload/drive/v3",
  siteUrl: "https://mialbumweb.netlify.app",
  /** Se rellena con asegurarEstructura(). */
  memo: { raiz: "", inv: "", users: "", fotos: "" } as MemoEstructura,
};
