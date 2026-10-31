# MiAlbumWeb

Álbum de fotos colaborativo **sin backend**: el frontend estático habla directamente con la API
REST de Google Drive usando OAuth 2.0. Cada dueño guarda su álbum en su propio Drive como
`MiAlbumWeb_Config/{usuarios.json, invitaciones.json, album.json, ocultas.json, grupos.json, fotos/}`. Cada persona puede
tener su álbum personal y, además, participar en los álbumes de otras cuentas.

- Producción: <https://mialbumweb.netlify.app>
- Stack: **Astro** (MPA estático) + **Tailwind CSS v4** + **Svelte 5** (islas) + **TypeScript**.
- Sin servidores, sin base de datos, sin funciones serverless.

### Scopes de Google

- **Único scope:** `https://www.googleapis.com/auth/drive`, tanto para el dueño como para el
  invitado. `drive.file` es por usuario, no por aplicación: Google solo deja ver los archivos que la
  app creó a nombre de esa cuenta. Como Drive asigna la propiedad a quien sube la foto, con
  `drive.file` el dueño no veía las fotos subidas por los invitados en su propia carpeta `fotos/`.
  Con `drive` ambas cuentas alcanzan la carpeta compartida y la colaboración funciona sin backend.
  La app solo lee y escribe dentro de `MiAlbumWeb_Config`. Es un scope restringido para Google, así
  que la app sin verificar muestra un aviso y tiene límite de usuarios. Detalles en «Google Cloud y
  limitaciones».

## Requisitos

- Node.js 22 o superior (Netlify usa `NODE_VERSION = "22"`).
- npm.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:4321
```

Para probar OAuth en local, el origen `http://localhost:4321` debe estar autorizado en el cliente
de Google Cloud. Alternativamente, usa el branch deploy de Netlify.

## Scripts

| Script              | Qué hace                                                     |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Servidor de desarrollo de Astro con HMR.                     |
| `npm run build`     | Genera el sitio estático en `dist/`.                         |
| `npm run preview`   | Sirve `dist/` en local (prueba el build real).               |
| `npm run check`     | Tipos de Astro + Svelte (`astro check` + `svelte-check`).    |
| `npm test`          | Tests de dominio con Vitest.                                 |
| `npm run lint`      | ESLint.                                                      |
| `npm run format`    | Prettier.                                                    |

`npm test` cubre servicios puros (permisos, invitaciones, galería, enlaces, álbumes, origen, errores,
QR). No sustituye una prueba manual: no ejecuta OAuth, ni la API de Drive, ni el navegador. Los flujos
de login, compartición, subida y salida de un álbum se verifican en local y en un deploy preview.

## Variables de entorno

| Variable                 | Obligatoria | Para qué                                                        |
| ------------------------ | ----------- | --------------------------------------------------------------- |
| `PUBLIC_GOOGLE_CLIENT_ID` | No         | Client ID público de OAuth. Hay un valor por defecto en `config`. |
| `PUBLIC_SITE_URL`         | No         | Origen público fijo (p. ej. producción). Sin ella se usa el origen real del navegador. |
| `PUBLIC_GOOGLE_API_KEY`   | No         | Clave pública de Google solo si se usa el Picker.               |

No fijes `PUBLIC_SITE_URL` a producción en local: los enlaces de invitación apuntarían allí. En
Netlify puede quedarse sin definir y cada deploy (producción o preview) usará su propio origen.
Ver `.env.example`.

## Rutas

| URL                | Página                                  |
| ------------------ | --------------------------------------- |
| `/`                | Portada                                 |
| `/albumes.html`    | Mis álbumes (personal + compartidos)    |
| `/album.html`      | Álbum (dueño o invitado)                |
| `/ajustes.html`    | Panel del administrador                 |
| `/privacidad.html` | Política de privacidad                  |
| `/terminos.html`   | Términos de uso                         |
| `/ui.html`         | Catálogo interno de componentes (noindex) |

El build usa `build.format: "file"` a propósito: conserva las URLs `.html` y, con ellas, los enlaces
de invitación ya emitidos (`album.html?drive=…&token=…`). El parámetro `album` es opcional, así que
los enlaces antiguos siguen abriendo el álbum.

## Álbumes y participación

- Tras iniciar sesión se entra en `/albumes.html`: el **álbum personal** (siempre `/album.html`, sin
  parámetros) y los **álbumes compartidos** a los que te han invitado.
- La lista de álbumes unidos se guarda en `localStorage` (`MiAlbumWeb_albumes`), **sin tokens**. Es
  por navegador: unirte desde el móvil no lo muestra en el portátil, pero el enlace de invitación
  sigue funcionando.
- «Unirme con un enlace» acepta una URL completa o el texto de un QR y conserva la query original.
- Volver a un álbum ya unido usa un enlace **sin token** (`/album.html?drive=…&inv=…&users=…&fotos=…`).
  La pertenencia se valida contra `usuarios.json`; si ya no estás, la app lo explica y ofrece «Quitar
  de mi lista».
- «Salir del álbum» elimina tu propia entrada de `usuarios.json`, borra la fila local y vuelve al
  hub. No cierra la sesión ni borra fotos. El administrador no puede salir de su propio álbum.
- El nombre visible vive en `album.json` y lo edita el dueño desde ajustes.
- El borrado desde la galería es siempre lógico: la foto se registra en `ocultas.json` y deja de
  mostrarse. El propietario real de la foto la ve en «Fotos eliminadas» y puede restaurarla o
  eliminarla definitivamente de Drive. Esto evita intentar borrar archivos propiedad de otra cuenta.
- La galería permite filtrar por nombre, subidor, fechas y grupos. Los grupos virtuales se guardan en
  `grupos.json` y se comparten con el álbum; no crean carpetas físicas ni duplican fotografías.

## Arquitectura

```
src/
├─ layouts/Base.astro          # head, tema, cabecera/pie, toasts
├─ components/
│  ├─ ui/                      # Boton, Campo, Modal, Toast, InterruptorTema…
│  ├─ layout/                  # Cabecera, Pie, Contenedor
│  ├─ album/                   # AlbumApp, Galeria, FotoCard, Lightbox, ZonaSubida…
│  ├─ albumes/                 # MisAlbumes (hub personal + compartidos)
│  └─ ajustes/                 # AjustesApp (invitaciones, usuarios, QR)
├─ lib/
│  ├─ config.ts · origen.ts · tipos.ts · auth.ts · qr.ts
│  ├─ drive/                   # api.ts (REST) + structure.ts (carpetas y JSONs)
│  ├─ services/                # puros: permisos, invitaciones, galería, enlaces, álbumes, errores, texto
│  └─ stores/                  # estado con runes: album.svelte.ts, albumes.svelte.ts, toast.svelte.ts
├─ pages/                      # index, albumes, album, ajustes, privacidad, terminos, 404, ui
└─ styles/                     # tokens.css + global.css
```

Regla de dependencias: `páginas → componentes → stores → services → drive/auth → config`.
Los servicios no tocan el DOM ni la red; el único módulo que habla con Drive es
`src/lib/drive/api.ts`.

## Dependencias con valor real

- **astro**: MPA estático, rutas por archivo, cero JS por defecto.
- **tailwindcss + @tailwindcss/vite**: utilidades y capa de componentes sobre los tokens CSS.
- **@astrojs/svelte + svelte**: islas interactivas (álbum, ajustes, tema, toasts, modales).
- **typescript + @astrojs/check + svelte-check**: tipado del dominio y de las props.
- **uqr** (~2 KB): QR generado en el navegador; sustituye al servicio externo `api.qrserver.com`.
- **vitest**: tests de los servicios puros.
- **eslint + prettier**: estilo y errores comunes.

## Despliegue

**Netlify desde Git (recomendado).** El repo incluye `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Conecta el repositorio en Netlify y cada push genera un deploy; las ramas producen deploy previews.

**Manual.** Ejecuta `npm run build` y arrastra la carpeta `dist/` al panel de Netlify. No subas la
raíz del repo: las páginas reales viven en `dist/`.

Variables: ver «Variables de entorno». `PUBLIC_SITE_URL` es opcional; sin ella el build no fija
dominio y los enlaces de invitación usan el origen del navegador (local, preview o producción).

## Google Cloud y limitaciones

Para que funcione el flujo completo:

1. Añade a la pantalla de consentimiento el scope `drive`. Ya no se usa `drive.file`.
2. Autoriza como orígenes `http://localhost:4321`, producción y el branch deploy que uses para
   probar. Google no admite comodines.
3. Si la app está en modo Testing, añade como test users a las cuentas que vayan a probarla.

Limitaciones que se aceptan con este diseño:

- La app no está verificada por Google: verás el aviso de «app no verificada» y hay un límite de
  usuarios. Publicarla para cualquiera exigiría verificación y evaluación de seguridad.
- Los archivos se comparten como `anyone` con escritura (`fotos/`, `usuarios.json`, `ocultas.json`) o
  lectura (`invitaciones.json`, `album.json`) porque no hay backend que gestione permisos por email.
  El token de invitación protege la app, no el acceso directo a Drive.
- El scope es amplio para todas las cuentas; la app solo usa la carpeta `MiAlbumWeb_Config`.
- Las fotos que sube un invitado son suyas en Drive: consumen su cuota y desaparecen del álbum si
  esa persona las borra desde su cuenta. Solo el dueño de un archivo puede borrarlo o mandarlo a la
  papelera, así que el dueño del álbum no puede eliminar de Drive lo ajeno: al quitarlas se guarda
  su id en `ocultas.json` y dejan de mostrarse en el álbum.
- Un invitado puede modificar `usuarios.json` (está compartido con escritura) y, por tanto, editar
  los permisos de otras personas. Es inherente a compartir el archivo sin backend.
- La lista de álbumes en los que participas vive en `localStorage` (`MiAlbumWeb_albumes`) y nunca
  guarda tokens. Al entrar en un álbum sin token se valida la pertenencia contra `usuarios.json`.

## Cabeceras

`public/_headers` aplica `Referrer-Policy: no-referrer` para que el token de invitación no se filtre
por el `Referer`, además de `nosniff`, `X-Frame-Options: DENY` y una `Permissions-Policy` restrictiva.

## Estructura de datos en Drive

Cada álbum vive en `MiAlbumWeb_Config/` dentro del Drive de su dueño:

```
MiAlbumWeb_Config/
├── usuarios.json       # personas autorizadas + rol/permisos
├── invitaciones.json   # tokens de invitación activos
├── album.json          # nombre visible del álbum
├── ocultas.json        # ids de fotos ocultas del álbum
└── fotos/              # imágenes
```

Ver `AGENTS.md` para el contrato completo.
