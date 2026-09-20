const Drive = {
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

  async get(url) {
    const r = await fetch(url, { headers: this.h() });
    if (!r.ok) throw new Error(await this.msg(r));
    return r.json();
  },

  async post(meta, url) {
    const r = await fetch(url || CONFIG.apiBase + "/files", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, this.h()),
      body: JSON.stringify(meta)
    });
    if (!r.ok) throw new Error(await this.msg(r));
    return r.json();
  },

  list(q, campos) {
    const url = CONFIG.apiBase + "/files?pageSize=1000&fields=" + encodeURIComponent(campos) + "&q=" + encodeURIComponent(q);
    return this.get(url).then(function (d) { return d.files || []; });
  },

  async leer(id) {
    const r = await fetch(CONFIG.apiBase + "/files/" + id + "?alt=media", { headers: this.h() });
    if (!r.ok) throw new Error(await this.msg(r));
    return r.text();
  },

  async borrar(id) {
    const r = await fetch(CONFIG.apiBase + "/files/" + id, { method: "DELETE", headers: this.h() });
    if (!r.ok) throw new Error(await this.msg(r));
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
    if (!r.ok) throw new Error(await this.msg(r));
    return r.json();
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
    if (!r.ok) throw new Error(await this.msg(r));
    return r.json();
  },

  compartir(id, rol) {
    return this.post({ role: rol, type: "anyone" }, CONFIG.apiBase + "/files/" + id + "/permissions");
  },

  buscarCarpeta(nombre, cPadre) {
    const q = "name='" + nombre + "' and mimeType='" + CONFIG.folderMime + "' and '" + cPadre + "' in parents and trashed=false";
    const self = this;
    return this.list(q, "files(id,name)").then(function (f) {
      return f[0] || self.crearCarpeta(nombre, cPadre);
    });
  },

  pedirJsonCarpeta(nombre, cPadre) {
    const q = "name='" + nombre + "' and '" + cPadre.id + "' in parents and trashed=false";
    const self = this;
    return this.list(q, "files(id,name)").then(function (f) {
      if (f[0]) return f[0];
      return self.crearJson(nombre, cPadre.id).then(function (creado) {
        return self.actualizarJson(creado.id, {}).then(function () { return creado; });
      });
    });
  },

  async asegurarEstructura() {
    const raiz = await this.buscarCarpeta(CONFIG.rootNombre, "root");
    const inv = await this.pedirJsonCarpeta("invitaciones.json", raiz);
    const users = await this.pedirJsonCarpeta("usuarios.json", raiz);
    const fotos = await this.buscarCarpeta("fotos", raiz.id);
    CONFIG.memo = { raiz: raiz.id, inv: inv.id, users: users.id, fotos: fotos.id };
    return CONFIG.memo;
  },

  listarFotos(fId) {
    return this.list("'" + fId + "' in parents and trashed=false", "files(id,name,mimeType,thumbnailLink,createdTime,size)");
  },

  async fotoUrl(id) {
    const r = await fetch(CONFIG.apiBase + "/files/" + id + "?alt=media", { headers: this.h() });
    if (!r.ok) throw new Error(await this.msg(r));
    return URL.createObjectURL(await r.blob());
  }
};