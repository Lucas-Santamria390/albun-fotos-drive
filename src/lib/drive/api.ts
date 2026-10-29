import { CONFIG } from "../config";
import { AUTH } from "../auth";
import type { ArchivoDrive, ErrorHttp } from "../tipos";

interface ListaArchivos {
  files?: ArchivoDrive[];
  nextPageToken?: string;
}

interface ErrorDrive {
  error?: { message?: string };
}

const CAMPOS_FOTO = "files(id,name,mimeType,thumbnailLink,createdTime,size)";

function crearError(mensaje: string, code: number): ErrorHttp {
  const error = new Error(mensaje) as ErrorHttp;
  error.code = code;
  return error;
}

/**
 * Capa REST de Google Drive.
 * Contrato estable: el resto de la app no debe hablar con Drive directamente.
 * Los métodos usan `this`, así que siempre se invocan como `DriveApi.x()`.
 */
export const DriveApi = {
  h(): Record<string, string> {
    return AUTH.token ? { Authorization: "Bearer " + AUTH.token } : {};
  },

  async msg(r: Response): Promise<string> {
    try {
      const datos = (await r.json()) as ErrorDrive;
      return datos?.error?.message ?? "Error " + r.status;
    } catch {
      return "Error " + r.status;
    }
  },

  async err(r: Response): Promise<ErrorHttp> {
    return crearError(await this.msg(r), r.status);
  },

  async get<T>(url: string): Promise<T> {
    const r = await fetch(url, { headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return (await r.json()) as T;
  },

  async post<T>(meta: unknown, url?: string): Promise<T> {
    const r = await fetch(url ?? CONFIG.apiBase + "/files", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.h() },
      body: JSON.stringify(meta),
    });
    if (!r.ok) throw await this.err(r);
    return (await r.json()) as T;
  },

  async list(q: string, campos: string): Promise<ArchivoDrive[]> {
    const url =
      CONFIG.apiBase +
      "/files?pageSize=1000&fields=" +
      encodeURIComponent(campos) +
      "&q=" +
      encodeURIComponent(q);
    const datos = await this.get<ListaArchivos>(url);
    return datos.files ?? [];
  },

  /** Lista TODOS los archivos recorriendo nextPageToken (álbumes grandes). */
  async listarTodas(q: string, campos: string = CAMPOS_FOTO): Promise<ArchivoDrive[]> {
    const resultado: ArchivoDrive[] = [];
    let pageToken: string | undefined;

    do {
      const url =
        CONFIG.apiBase +
        "/files?pageSize=1000&fields=" +
        encodeURIComponent(campos) +
        "&q=" +
        encodeURIComponent(q) +
        (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
      const datos = await this.get<ListaArchivos>(url);
      resultado.push(...(datos.files ?? []));
      pageToken = datos.nextPageToken;
    } while (pageToken);

    return resultado;
  },

  async leer(id: string): Promise<string> {
    const r = await fetch(CONFIG.apiBase + "/files/" + id + "?alt=media", { headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return r.text();
  },

  async borrar(id: string): Promise<true> {
    const r = await fetch(CONFIG.apiBase + "/files/" + id, {
      method: "DELETE",
      headers: this.h(),
    });
    if (!r.ok) throw await this.err(r);
    return true;
  },

  subirConProgreso(
    meta: unknown,
    blob: Blob,
    nombre: string,
    onProgreso?: (pct: number) => void,
  ): Promise<ArchivoDrive> {
    return new Promise((resolver, rechazar) => {
      const fd = new FormData();
      fd.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
      fd.append("file", blob, nombre);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", CONFIG.uploadBase + "/files?uploadType=multipart");
      xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgreso) {
          onProgreso(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolver(JSON.parse(xhr.responseText) as ArchivoDrive);
          } catch {
            rechazar(new Error("Respuesta inválida del servidor"));
          }
          return;
        }
        try {
          const datos = JSON.parse(xhr.responseText) as ErrorDrive;
          rechazar(crearError(datos.error?.message ?? "Error " + xhr.status, xhr.status));
        } catch {
          rechazar(crearError("Error " + xhr.status, xhr.status));
        }
      };

      xhr.onerror = () => rechazar(new Error("Error de red al subir"));
      xhr.send(fd);
    });
  },

  crearCarpeta(nombre: string, cPadre: string): Promise<ArchivoDrive> {
    return this.post<ArchivoDrive>({
      name: nombre,
      mimeType: CONFIG.folderMime,
      parents: [cPadre],
    });
  },

  crearJson(nombre: string, cPadre: string): Promise<ArchivoDrive> {
    return this.post<ArchivoDrive>({
      name: nombre,
      mimeType: CONFIG.jsonMime,
      parents: [cPadre],
    });
  },

  async actualizarJson<T>(id: string, obj: unknown): Promise<T> {
    const r = await fetch(CONFIG.uploadBase + "/files/" + id + "?uploadType=media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...this.h() },
      body: JSON.stringify(obj, null, 2),
    });
    if (!r.ok) throw await this.err(r);
    return (await r.json()) as T;
  },

  compartir(id: string, rol: "reader" | "writer"): Promise<unknown> {
    return this.post<unknown>(
      { role: rol, type: "anyone" },
      CONFIG.apiBase + "/files/" + id + "/permissions",
    );
  },

  listarFotos(fId: string): Promise<ArchivoDrive[]> {
    return this.listarTodas("'" + fId + "' in parents and trashed=false", CAMPOS_FOTO);
  },

  /** Devuelve una URL de objeto (blob) para mostrar o descargar una foto. */
  async fotoUrl(id: string): Promise<string> {
    const r = await fetch(CONFIG.apiBase + "/files/" + id + "?alt=media", { headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return URL.createObjectURL(await r.blob());
  },
};
