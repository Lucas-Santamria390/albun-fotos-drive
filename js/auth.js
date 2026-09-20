const AUTH = {
  token: null,
  client: null,
  user: null,

  init() {
    this.token = sessionStorage.getItem("MiAlbumWeb_token") || null;
  },

  cargarScript() {
    return new Promise((res, rej) => {
      if (window.google && window.google.accounts) return res();
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => res();
      s.onerror = () => rej(new Error("No se pudo cargar la librería de Google"));
      document.head.appendChild(s);
    });
  },

  login() {
    const self = this;
    return this.cargarScript().then(function () {
      if (!self.client) {
        self.client = google.accounts.oauth2.initTokenClient({
          client_id: CONFIG.clientId,
          scope: CONFIG.scope,
          callback: function (r) {
            if (r.access_token) {
              self.token = r.access_token;
              sessionStorage.setItem("MiAlbumWeb_token", r.access_token);
              if (self._cb) { var c = self._cb; self._cb = null; c(); }
            } else if (self._err) {
              var e = self._err; self._err = null;
              e(new Error(r.error_description || r.error || "Inicio de sesión no completado"));
            }
          }
        });
      }
      return new Promise(function (res, rej) {
        self._cb = res;
        self._err = rej;
        self.client.requestAccessToken();
      });
    });
  },

  quienSoy() {
    const self = this;
    if (this.user) return Promise.resolve(this.user);
    return fetch(CONFIG.apiBase + "/about?fields=user", {
      headers: { Authorization: "Bearer " + this.token }
    }).then(function (r) {
      if (!r.ok) throw new Error("No se pudo obtener la sesión");
      return r.json();
    }).then(function (d) {
      self.user = d.user || { emailAddress: "", displayName: "" };
      return self.user;
    });
  },

  salir() {
    this.token = null;
    this.user = null;
    sessionStorage.removeItem("MiAlbumWeb_token");
  }
};