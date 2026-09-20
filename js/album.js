const CD = {
  $: function (s) { return document.querySelector(s); },
  $$: function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
};

const Album = {
  params: null,
  modo: "owner",
  yo: null,
  yoNombre: null,
  rol: null,
  permisos: null,
  fId: null,
  usuarios: {},
  invitaciones: {},
  galeriaCache: {},
  invitacionActual: "",

  init() {
    AUTH.init();
    this.params = new URLSearchParams(location.search);
    this.modo = this.params.get("token") ? "inv" : "owner";
    CD.$("#btnSalir").addEventListener("click", function () {
      AUTH.salir();
      location.href = "index.html";
    });
    CD.$("#btnLoginGoogle").addEventListener("click", () => this.comenzarLogin());
    CD.$("#btnSubir").addEventListener("click", function () { CD.$("#inputSubir").click(); });
    CD.$("#inputSubir").addEventListener("change", (e) => this.subirFotos(e.target.files));
    CD.$("#btnCrearInvitacion").addEventListener("click", () => this.crearInvitacion());
    CD.$("#btnCopiar").addEventListener("click", () => this.copiarEnlace());
    CD.$("#btnCerrarFoto").addEventListener("click", () => CD.$("#modalFoto").classList.add("oculto"));
    CD.$("#formNombre").addEventListener("submit", (e) => this.enviarNombre(e));
    CD.$("#selRol").addEventListener("change", (e) => this.cambiarRol(e));
    CD.$("#galeria").addEventListener("click", (e) => this.clickGaleria(e));
    CD.$("#listaInvitaciones").addEventListener("click", (e) => this.clickInvitaciones(e));
    CD.$("#modalFoto").addEventListener("click", function (e) {
      if (e.target === CD.$("#modalFoto")) CD.$("#modalFoto").classList.add("oculto");
    });

    if (!AUTH.token) {
      CD.$("#capaAuth").classList.remove("oculto");
      CD.$("#capaContenido").classList.add("oculto");
      return;
    }
    this.continuar();
  },

  comenzarLogin() {
    const msj = CD.$("#msjCapa");
    msj.textContent = "Conectando con Google…";
    AUTH.login().then(() => this.continuar()).catch(function (e) {
      msj.textContent = e.message;
    });
  },

  async continuar() {
    try {
      const u = await AUTH.quienSoy();
      this.yo = u.emailAddress;
      this.yoNombre = u.displayName || this.yo;
      CD.$("#capaAuth").classList.add("oculto");
      CD.$("#capaContenido").classList.remove("oculto");
      if (this.modo === "owner") {
        await this.iniciarOwner();
        this.renderAdmin();
      } else {
        await this.entrarInvitado();
      }
      await this.cargarGaleria();
      this.renderBotones();
      this.renderSesion();
    } catch (e) {
      this.msjError(e.message);
      CD.$("#capaContenido").classList.add("oculto");
      CD.$("#capaAuth").classList.remove("oculto");
      CD.$("#msjCapa").textContent = e.message;
    }
  },

  async iniciarOwner() {
    await Drive.asegurarEstructura();
    this.fId = CONFIG.memo.fotos;
    await Drive.compartir(CONFIG.memo.users, "writer").catch(function () {});
    await Drive.compartir(CONFIG.memo.inv, "reader").catch(function () {});
    await Drive.compartir(this.fId, "writer").catch(function () {});
    this.usuarios = await this.cargarJson(CONFIG.memo.users);
    if (!this.usuarios[this.yo] || (this.usuarios[this.yo].rol !== "admin")) {
      this.usuarios[this.yo] = {
        nombre: this.yoNombre,
        rol: "admin",
        permisos: { subir: true, borrar: true, modificar: true }
      };
      await Drive.actualizarJson(CONFIG.memo.users, this.usuarios);
    }
    this.rol = "admin";
    this.permisos = this.usuarios[this.yo].permisos || { subir: true, borrar: true, modificar: true };
    this.invitaciones = await this.cargarJson(CONFIG.memo.inv);
  },

  async entrarInvitado() {
    const token = this.params.get("token");
    const invId = this.params.get("inv");
    const usersId = this.params.get("users");
    const fId = this.params.get("fotos");
    if (!invId || !usersId || !fId) {
      this.msjError("Enlace de invitación incompleto.");
      return;
    }
    this.fId = fId;
    const invs = await this.cargarJson(invId);
    const inv = invs[token];
    if (!inv) {
      this.msjError("Invitación no válida o ya no existe.");
      return;
    }
    if (inv.expiracion && inv.expiracion !== "indefinida" && new Date(inv.expiracion) < new Date()) {
      this.msjError("Esta invitación ha expirado.");
      return;
    }
    this.usuarios = await this.cargarJson(usersId);
    if (!this.usuarios[this.yo]) {
      this.permisos = inv.permisos || { subir: true, borrar: false, modificar: false };
      this.rol = inv.rol;
      CD.$("#modalNombre").classList.remove("oculto");
      CD.$("#inpNombre").focus();
      return;
    }
    this.usuarios[this.yo] = this.usuarios[this.yo];
    this.rol = this.usuarios[this.yo].rol;
    this.permisos = this.usuarios[this.yo].permisos;
  },

  enviarNombre(e) {
    e.preventDefault();
    const nombre = CD.$("#inpNombre").value.trim();
    if (!nombre) return;
    CD.$("#modalNombre").classList.add("oculto");
    this.usuarios[this.yo] = {
      nombre: nombre,
      rol: this.rol || "colaborador",
      permisos: this.permisos || { subir: true, borrar: false, modificar: false }
    };
    const reg = this.usuarios[this.yo];
    const stor = reg;
    Drive.actualizarJson(this.params.get("users"), this.usuarios).then(() => {
      this.rol = stor.rol;
      this.permisos = stor.permisos;
      this.renderBotones();
      this.renderSesion();
      return this.cargarGaleria();
    }).catch((err) => this.msjError(err.message));
  },

  async cargarJson(id) {
    try {
      const t = await Drive.leer(id);
      return t ? JSON.parse(t) : {};
    } catch (e) {
      return {};
    }
  },

  async cargarGaleria() {
    const secg = CD.$("#galeria");
    secg.innerHTML = "";
    this.galeriaCache = {};
    const fotos = await Drive.listarFotos(this.fId);
    if (!fotos.length) {
      secg.innerHTML = '<p class="vacio">Aún no hay fotos en este álbum. Sube la primera.</p>';
      return;
    }
    for (const f of fotos) {
      secg.appendChild(this.tarjetaFoto(f));
      this.cargarImagen(f);
    }
  },

  tarjetaFoto(f) {
    const t = document.createElement("div");
    t.className = "foto";
    t.dataset.id = f.id;
    const img = document.createElement("img");
    img.alt = f.name;
    t.appendChild(img);
    if (this.permisos && this.permisos.borrar) {
      const b = document.createElement("button");
      b.className = "borrar";
      b.textContent = "Borrar";
      b.title = "Eliminar foto";
      t.appendChild(b);
    }
    return t;
  },

  cargarImagen(f) {
    const t = CD.$("#galeria .foto[data-id='" + f.id + "']");
    if (!t) return;
    Drive.fotoUrl(f.id).then(function (url) {
      const img = t.querySelector("img");
      if (img) img.src = url;
      Album.galeriaCache[f.id] = url;
    }).catch(function () {
      const img = t.querySelector("img");
      if (img) { img.alt = "No accesible"; img.classList.add("fallo"); }
    });
  },

  clickGaleria(e) {
    const tar = e.target.closest(".foto");
    if (!tar) return;
    const id = tar.dataset.id;
    if (e.target.closest(".borrar")) {
      this.borrarFoto(id, tar);
      return;
    }
    const url = this.galeriaCache[id];
    if (!url) return;
    CD.$("#imgGrande").src = url;
    CD.$("#modalFoto").classList.remove("oculto");
  },

  async borrarFoto(id, tar) {
    try {
      await Drive.borrar(id);
      if (this.galeriaCache[id]) URL.revokeObjectURL(this.galeriaCache[id]);
      delete this.galeriaCache[id];
      tar.remove();
    } catch (err) {
      this.msjError(err.message);
    }
  },

  async subirFotos(files) {
    this.msjInfo("Subiendo…");
    for (const f of files) {
      if (CONFIG.mimeImagen.indexOf(f.type) < 0) continue;
      try {
        const meta = { name: f.name, mimeType: f.type, parents: [this.fId] };
        const creado = await Drive.subirArchivo(meta, f, f.name);
        this.galeriaCache = this.galeriaCache || {};
        const secg = CD.$("#galeria");
        const vacio = secg.querySelector(".vacio");
        if (vacio) vacio.remove();
        const tar = this.tarjetaFoto(creado);
        secg.insertBefore(tar, secg.firstChild);
        this.cargarImagen(creado);
      } catch (err) {
        this.msjError("No se pudo subir " + f.name + ": " + err.message);
      }
    }
    CD.$("#inputSubir").value = "";
    this.msjInfo("");
  },

  renderBotones() {
    CD.$("#panelAdmin").classList.toggle("oculto", this.modo !== "owner");
    CD.$("#secSubir").classList.toggle("oculto", !(this.permisos && this.permisos.subir));
  },

  renderSesion() {
    CD.$("#txtSesion").textContent = (this.yoNombre || this.yo) + " · " + (this.rol || "visitante");
  },

  renderAdmin() {
    CD.$("#panelAdmin").classList.remove("oculto");
    this.renderUsuarios();
    this.renderInvitaciones();
  },

  renderUsuarios() {
    const ul = CD.$("#listaUsuarios");
    const keys = Object.keys(this.usuarios || {});
    ul.innerHTML = "";
    keys.sort().forEach((k) => {
      const li = document.createElement("li");
      const u = this.usuarios[k];
      const per = u.permisos || {};
      li.textContent = (u.nombre || k) + " (" + k + ") — " + (u.rol || "?") +
        " [subir:" + (per.subir ? "sí" : "no") + "] [borrar:" + (per.borrar ? "sí" : "no") + "] [modificar:" + (per.modificar ? "sí" : "no") + "]";
      ul.appendChild(li);
    });
  },

  renderInvitaciones() {
    const ul = CD.$("#listaInvitaciones");
    ul.innerHTML = "";
    Object.keys(this.invitaciones || {}).forEach(function (tok) {
      const inv = Album.invitaciones[tok];
      const li = document.createElement("li");
      const txt = document.createElement("span");
      txt.textContent = tok + " · " + inv.rol + " · " + (inv.expiracion || "indefinida");
      const b = document.createElement("button");
      b.className = "borrar-inv";
      b.textContent = "Borrar";
      b.dataset.token = tok;
      li.appendChild(txt);
      li.appendChild(b);
      ul.appendChild(li);
    });
  },

  async clickInvitaciones(e) {
    const btn = e.target.closest(".borrar-inv");
    if (!btn) return;
    delete this.invitaciones[btn.dataset.token];
    await Drive.actualizarJson(CONFIG.memo.inv, this.invitaciones);
    this.renderInvitaciones();
  },

  cambiarRol(e) {
    const visit = e.target.value === "visitante";
    CD.$("#chkSubir").checked = !visit;
    CD.$("#chkBorrar").checked = false;
    CD.$("#chkModificar").checked = false;
  },

  async crearInvitacion() {
    const rol = CD.$("#selRol").value;
    const exp = CD.$("#inpExp").value.trim() || "indefinida";
    const per = {
      subir: CD.$("#chkSubir").checked,
      borrar: CD.$("#chkBorrar").checked,
      modificar: CD.$("#chkModificar").checked
    };
    const token = "alb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    this.invitaciones[token] = { rol: rol, permisos: per, expiracion: exp };
    await Drive.actualizarJson(CONFIG.memo.inv, this.invitaciones);
    const enlace = this.construirEnlace(encodeURIComponent(token));
    this.invitacionActual = enlace;
    CD.$("#salidaInvitacion").classList.remove("oculto");
    CD.$("#enlaceInv").value = enlace;
    CD.$("#qrInv").src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(enlace);
    this.renderInvitaciones();
  },

  construirEnlace(token) {
    const base = CONFIG.siteUrl || location.origin;
    return base + "/album.html?drive=" + CONFIG.memo.raiz +
      "&token=" + token +
      "&inv=" + CONFIG.memo.inv +
      "&users=" + CONFIG.memo.users +
      "&fotos=" + CONFIG.memo.fotos;
  },

  copiarEnlace() {
    if (!this.invitacionActual) return;
    navigator.clipboard.writeText(this.invitacionActual).then(function () {
      Album.msjInfo("Enlace copiado al portapapeles.");
    });
  },

  msjInfo(t) {
    const m = CD.$("#msjGlobal");
    if (!m) return;
    m.textContent = t;
    m.className = t ? "msj ok" : "msj";
  },

  msjError(t) {
    const m = CD.$("#msjGlobal");
    if (!m) return;
    m.textContent = t;
    m.className = "msj error";
  }
};

document.addEventListener("DOMContentLoaded", function () { Album.init(); });