import { CONFIG, SCOPE } from "./config";
import type { ErrorHttp, PerfilGoogle } from "./tipos";

const CLAVE_TOKEN = "MiAlbumWeb_token";
const CLAVE_SCOPE = "MiAlbumWeb_scope";

interface RespuestaToken {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (r: RespuestaToken) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

function crearError(mensaje: string, code?: number): ErrorHttp {
  const error = new Error(mensaje) as ErrorHttp;
  if (code !== undefined) error.code = code;
  return error;
}

/**
 * Sesión OAuth implícita con Google.
 * El token vive en sessionStorage (se pierde al cerrar la pestaña).
 * También se guarda el scope usado: si cambia (por ejemplo, tokens antiguos de
 * `drive.file`), se fuerza un login nuevo en lugar de reutilizarlo.
 */
export const AUTH = {
  token: null as string | null,
  scope: null as string | null,
  client: null as TokenClient | null,
  clientScope: null as string | null,
  user: null as PerfilGoogle | null,
  _cb: null as (() => void) | null,
  _err: null as ((e: Error) => void) | null,

  init(): void {
    this.token = sessionStorage.getItem(CLAVE_TOKEN);
    this.scope = sessionStorage.getItem(CLAVE_SCOPE);
  },

  cargarScript(): Promise<void> {
    return new Promise((resolver, rechazar) => {
      if (window.google?.accounts?.oauth2) {
        resolver();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolver();
      script.onerror = () => rechazar(new Error("No se pudo cargar la librería de Google"));
      document.head.appendChild(script);
    });
  },

  async login(scope: string = SCOPE): Promise<void> {
    await this.cargarScript();

    if (!this.client || this.clientScope !== scope) {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) throw new Error("No se pudo cargar la librería de Google");

      this.client = oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope,
        callback: (r) => {
          if (r.access_token) {
            this.token = r.access_token;
            this.scope = scope;
            this.user = null;
            sessionStorage.setItem(CLAVE_TOKEN, r.access_token);
            sessionStorage.setItem(CLAVE_SCOPE, scope);
            const cb = this._cb;
            this._cb = null;
            this._err = null;
            cb?.();
            return;
          }

          const err = this._err;
          this._cb = null;
          this._err = null;
          err?.(crearError(r.error_description || r.error || "Inicio de sesión no completado", 401));
        },
      });
      this.clientScope = scope;
    }

    return new Promise<void>((resolver, rechazar) => {
      this._cb = resolver;
      this._err = rechazar;
      this.client?.requestAccessToken();
    });
  },

  async quienSoy(): Promise<PerfilGoogle> {
    if (this.user) return this.user;

    const r = await fetch(CONFIG.apiBase + "/about?fields=user", {
      headers: { Authorization: "Bearer " + this.token },
    });

    if (!r.ok) {
      throw crearError(
        r.status === 401 ? "Tu sesión expiró. Inicia sesión de nuevo." : "No se pudo obtener la sesión",
        r.status
      );
    }

    const datos = (await r.json()) as { user?: PerfilGoogle };
    this.user = datos.user ?? { emailAddress: "", displayName: "" };
    return this.user;
  },

  salir(): void {
    this.token = null;
    this.scope = null;
    this.user = null;
    this.client = null;
    this.clientScope = null;
    this._cb = null;
    this._err = null;
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_SCOPE);
  },
};
