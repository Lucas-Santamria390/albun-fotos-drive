import { origenSitio } from "../config";
import { DriveApi } from "../drive/api";
import {
  CLAVE_ALBUMES,
  agregarAlbum,
  enlaceAlbum,
  estaEnLista,
  leerAlbumes,
  quitarAlbum,
  serializarAlbumes,
} from "../services/albumes";
import type { AlbumGuardado, Usuarios } from "../tipos";

/**
 * Álbumes de este navegador: el dueño no se guarda aquí (su álbum es fijo),
 * solo los álbumes a los que te invitaron. No se guardan tokens.
 */
class EstadoAlbumes {
  lista = $state<AlbumGuardado[]>([]);

  cargar(): void {
    try {
      this.lista = leerAlbumes(localStorage.getItem(CLAVE_ALBUMES));
    } catch {
      // Almacenamiento bloqueado (modo privado): la lista vive en memoria.
      this.lista = [];
    }
  }

  agregar(entrada: AlbumGuardado): void {
    this.lista = agregarAlbum(this.lista, entrada);
    this.#guardar();
  }

  quitar(drive: string): void {
    this.lista = quitarAlbum(this.lista, drive);
    this.#guardar();
  }

  tiene(drive: string): boolean {
    return estaEnLista(this.lista, drive);
  }

  /** Enlace para volver a abrir un álbum ya unido (sin token). */
  enlace(entrada: AlbumGuardado): string {
    return enlaceAlbum(entrada, origenSitio());
  }

  /**
   * Salir de un álbum: borra la entrada propia de usuarios.json y la fila
   * local. Se relee el archivo para no pisar cambios del dueño.
   */
  async salirDe(album: { drive: string; users: string }, email: string): Promise<void> {
    const texto = await DriveApi.leer(album.users);

    // No se sobrescribe un archivo ilegible: sería peor perder todos los accesos.
    let usuarios: Usuarios = {};
    if (texto.trim()) {
      try {
        usuarios = JSON.parse(texto) as Usuarios;
      } catch {
        throw new Error("No se pudo leer la lista de personas del álbum. Inténtalo más tarde.");
      }
    }

    delete usuarios[email];
    await DriveApi.actualizarJson(album.users, usuarios);
    this.quitar(album.drive);
  }

  #guardar(): void {
    try {
      localStorage.setItem(CLAVE_ALBUMES, serializarAlbumes($state.snapshot(this.lista)));
    } catch {
      // Sin persistencia: la sesión actual sigue funcionando.
    }
  }
}

export const albumes = new EstadoAlbumes();
