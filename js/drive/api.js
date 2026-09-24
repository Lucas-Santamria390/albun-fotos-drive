import { CONFIG } from "../config.js";
import { AUTH } from "../auth.js";

export const DriveApi = {
  h() {
    return AUTH.token ? { Authorization: "Bearer " + AUTH.token } : {};
  },

  async msg(r) {
    try {
      const d = await r.json();
      return d && d.error && d.error.message ? d.error.message : "Error " + r.status;
    } catch (e) {
      return "Error " + r.status;
    }
  },

  async err(r) {
    const e = new Error(await this.msg(r));
    e.code = r ? r.status : 0;
    return e;
  },

  async get(url) {
    const r = await fetch(url, { headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return r.json();
  },

  async post(meta, url) {
    const r = await fetch(url || CONFIG.apiBase + "/files", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, this.h()),
      body: JSON.stringify(meta)
    });
    if (!r.ok) throw await this.err(r);
    return r.json();
  },

  list(q, campos) {
    const url = CONFIG.apiBase + "/files?pageSize=1000&fields=" + encodeURIComponent(campos) + "&q=" + encodeURIComponent(q);
    return this.get(url).then(function (d) { return d.files || []; });
  },

  async leer(id) {
    const r = await fetch(CONFIG.apiBase + "/files/" + id + "?alt=media", { headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return r.text();
  },

  async borrar(id) {
    const r = await fetch(CONFIG.apiBase + "/files/" + id, { method: "DELETE", headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return true;
  },

  async subirArchivo(meta, blob, nombre) {
    const fd = new FormData();
    fd.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
    fd.append("file", blob, nombre);
    const r = await fetch(CONFIG.uploadBase + "/files?uploadType=multipart", {
      method: "POST",
      body: fd,
      headers: this.h()
    });
    if (!r.ok) throw await this.err(r);
    return r.json();
  },

  subirConProgreso(meta, blob, nombre, onProgreso) {
    return new Promise(function (res, rej) {
      const fd = new FormData();
      fd.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
      fd.append("file", blob, nombre);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CONFIG.uploadBase + "/files?uploadType=multipart");
      xhr.setRequestHeader("Authorization", "Bearer " + AUTH.token);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable && onProgreso) {
          onProgreso(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { res(JSON.parse(xhr.responseText)); }
          catch (e) { rej(new Error("Respuesta inválida del servidor")); }
        } else {
          try {
            const d = JSON.parse(xhr.responseText);
            const err = new Error(d.error && d.error.message ? d.error.message : "Error " + xhr.status);
            err.code = xhr.status;
            rej(err);
          } catch (e2) {
            rej(new Error("Error " + xhr.status));
          }
        }
      };
      xhr.onerror = function () { rej(new Error("Error de red al subir")); };
      xhr.send(fd);
    });
  },

  crearCarpeta(nombre, cPadre) {
    return this.post({ name: nombre, mimeType: CONFIG.folderMime, parents: [cPadre] });
  },

  crearJson(nombre, cPadre) {
    return this.post({ name: nombre, mimeType: CONFIG.jsonMime, parents: [cPadre] });
  },

  async actualizarJson(id, obj) {
    const r = await fetch(CONFIG.uploadBase + "/files/" + id + "?uploadType=media", {
      method: "PATCH",
      headers: Object.assign({ "Content-Type": "application/json" }, this.h()),
      body: JSON.stringify(obj, null, 2)
    });
    if (!r.ok) throw await this.err(r);
    return r.json();
  },

  compartir(id, rol) {
    return this.post({ role: rol, type: "anyone" }, CONFIG.apiBase + "/files/" + id + "/permissions");
  },

  listarFotos(fId) {
    return this.list("'" + fId + "' in parents and trashed=false", "files(id,name,mimeType,thumbnailLink,createdTime,size)");
  },

  async fotoUrl(id) {
    const r = await fetch(CONFIG.apiBase + "/files/" + id + "?alt=media", { headers: this.h() });
    if (!r.ok) throw await this.err(r);
    return URL.createObjectURL(await r.blob());
  }
};