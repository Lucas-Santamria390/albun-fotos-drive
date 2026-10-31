# AGENTS.md

Estado actual: **migrado a Astro + Tailwind + Svelte + TypeScript** (rama `feat/migracion-astro`). Este archivo es la especificación del proyecto y las convenciones vigentes. **Sin backend propio (fundamental)**; dependencias y build tools SÍ están permitidas cuando aportan valor real (criterios abajo).

Despliegue: `https://mialbumweb.netlify.app` (Netlify desde Git: `npm run build` → `dist/`). El origen se resuelve con `PUBLIC_SITE_URL` → `window.location.origin` → `""`; no hay dominio de producción fijo en el código (local, preview y producción usan su propio origen). El legado de `js/` y `css/` se conserva temporalmente sin uso y se elimina al cerrar la migración.
ClientId OAuth: `622196535234-ddrlisjppqaivef385ncm17jvi22pojk.apps.googleusercontent.com` (origen autorizado incluye `https://mialbumweb.netlify.app`, `http://localhost:4321` y los branch deploys de prueba). La app NO se envía a verificación de Google (se usa tal cual).

## Estructura de archivos

```
astro.config.mjs · svelte.config.js · tsconfig.json · netlify.toml
public/                                    # _headers, robots.txt, favicon.svg, og.svg
src/
 ├── layouts/Base.astro                    # head/SEO, tema pre-paint, cabecera, pie, toasts
 ├── components/
 │   ├── ui/        # Boton, Campo, ChipRol, Tarjeta, Prosa, Modal, Toast, InterruptorTema…
 │   ├── layout/    # Cabecera, Pie, Contenedor
 │   ├── acceso/    # BotonLogin (OAuth desde la portada)
 │   ├── album/     # AlbumApp, Galeria, FotoCard, Lightbox, ZonaSubida, BarraSeleccion…
 │   ├── albumes/   # MisAlbumes: álbum personal + álbumes compartidos + unirse por enlace
 │   ├── ajustes/   # AjustesApp (nombre del álbum, invitaciones, usuarios, QR local)
 │   └── demo/      # DemoInteraccion para /ui
 ├── lib/
 │   ├── tipos.ts      # Foto, Usuario, Invitacion, Permisos, Rol, ArchivoDrive, MemoEstructura, AlbumInfo, AlbumGuardado
 │   ├── config.ts     # CONFIG (clientId, SCOPE único, mimes, memo) + origenSitio()
 │   ├── origen.ts     # normalizarOrigen()/resolverOrigen(): puros, sin DOM ni env
 │   ├── auth.ts       # AUTH: token + scope en sessionStorage, login OAuth, quienSoy/salir
 │   ├── qr.ts         # QR local con uqr (SVG + data URL)
 │   ├── drive/
 │   │   ├── api.ts        # DriveApi: capa REST tipada (get/post/list/listarTodas/leer/borrar/subir…)
 │   │   └── structure.ts  # asegurarEstructura() + compartirAlbum()
 │   ├── services/     # puros, sin DOM ni red: permisos, invitaciones, galeria, enlaces, albumes, errores, texto
 │   └── stores/       # estado con runes: album.svelte.ts, albumes.svelte.ts, toast.svelte.ts
 ├── pages/            # index, albumes, album, ajustes, privacidad, terminos, 404, ui
 └── styles/           # tokens.css (variables claro/oscuro) + global.css (Tailwind v4)
tests/                 # Vitest sobre services, origen y qr (no OAuth/Drive/navegador)
```

## Convenciones de código

- **TypeScript** en `src/lib` (estricto) y **Svelte 5 con runes** (`$state`, `$derived`, `$props`, `$effect`) en los componentes. Las páginas son `.astro`.
- Un único `<script type="module">` por página ya no aplica: el punto de entrada lo genera el build. En local hace falta servidor (`npm run dev`), nunca abrir `file://`.
- **Regla de dependencias:** `páginas → componentes → stores → services → drive/auth → config`. Ningún componente importa `drive/api` directamente.
- Los servicios (`src/lib/services`) son puros: sin DOM, sin red, sin estado global. Ahí van reglas como permisos, validación de invitaciones, filtros/orden y enlaces.
- El estado vive en `src/lib/stores/album.svelte.ts` (clase con runes). No crear estado paralelo en componentes.
- `drive/api.ts` y `drive/structure.ts`: `this` válido solo invocando métodos como `DriveApi.x()`; no pasar métodos sueltos sin binder.
- `CONFIG.memo` se llena con `asegurarEstructura()` (dueño) o con los parámetros del enlace (`drive`, `inv`, `users`, `fotos`, `album`) en `prepararInvitado()`. La URL de invitación lleva `drive`, `token`, `inv`, `users`, `fotos` y, si existe, `album`; se construye con `enlaceInvitacion(token, memo, base)` y el token se codifica ahí una sola vez.
- El modo de `album.svelte.ts` se decide por la URL: con `drive` es un álbum ajeno (`inv`), sin `drive` es el propio (`owner`). Un invitado ya registrado puede entrar sin token; la pertenencia se valida contra `usuarios.json`.
- La lista de álbumes unidos vive en `localStorage` (`MiAlbumWeb_albumes`) mediante `albumes.svelte.ts` y `services/albumes.ts`. Nunca guarda tokens ni datos de OAuth: solo ids (`drive`, `inv`, `users`, `fotos`, `album`), nombre, rol y fecha.
- El origen del enlace sale de `origenSitio()` (`PUBLIC_SITE_URL` → `window.location.origin` → `""`). Nunca hardcodear un dominio de producción.
- Los módulos `.astro` no se pueden importar desde Svelte: los componentes compartidos dentro de islas deben ser `.svelte`.
- No usar `innerHTML` con datos no confiables. Para SVG estático de iconos se usa `set:html` solo con literales del propio código.
- `npm run check` y `npm test` deben pasar antes de commitear. `npm run build` debe generar `dist/` con `albumes.html`, `album.html` y `ajustes.html`.
- **Dependencias y build tools:** permitidas solo si aportan valor real. Criterios para añadir una:
  1. Realmente necesaria (resolver un problema que el navegador/estándar no resuelva bien).
  2. Madura, mantenida y open source.
  3. Sin dependencias duplicadas ni paquete excesivamente grande para una función simple.
  4. Documentarla en README (para qué y por qué).
  Ya adoptadas: Astro, Tailwind, Svelte, TypeScript, `uqr` (QR local), Vitest, ESLint, Prettier. NO añadir herramientas "por defecto"; decidir caso a caso.
- Front-end en español salvo navegación técnica del navegador. La portada (`src/pages/index.astro`) NO debe mostrar detalles técnicos (nada de "sin servidores", "Drive", "base de datos", "HTML5+CSS3+JS") — copy pensada para el usuario final.

## Concepto

Álbum de fotos colaborativo **100% serverless y descentralizado**. No hay backend ni base de datos central: el frontend estático (Astro + Tailwind + islas Svelte, compilado a HTML/CSS/JS) alojado en **Netlify** habla directamente con la API REST de **Google Drive**. Cada usuario dueño usa su propia cuenta de Google Drive como servidor de almacenamiento y "base de datos" en archivos JSON.

> Nota: el dominio y las reglas de negocio siguen en TypeScript puro y son testeables; el framework solo cubre la capa de presentación. La arquitectura no cambia: sin backend.

- Hosting: Netlify (free tier, URL `*.netlify.app`).
- Auth: **Google OAuth 2.0** con un único scope, `https://www.googleapis.com/auth/drive`, para dueño e invitado. `drive.file` es por usuario, no por app: Google solo muestra los archivos que la app creó a nombre de esa cuenta y, como Drive asigna la propiedad a quien sube la foto, el dueño no veía lo que subía un invitado en su propia carpeta `fotos/`. El scope se guarda con el token y se fuerza re-login si no coincide (`AUTH.scope !== scopeDelModo(...)`), así que los tokens antiguos de `drive.file` se descartan solos.
- Cero costos: solo capa gratuita de Netlify + Drive personal de cada usuario.

## Estructura de datos (Drive de cada dueño)

Todo el "backend" vive dentro de cada Drive personal del dueño del álbum:

```
MiAlbumWeb_Config/          ← carpeta raíz creada automáticamente en el Drive del dueño
 ├── usuarios.json          # usuarios autorizados + roles/permisos
 ├── invitaciones.json      # tokens de invitación activos
 ├── album.json             # nombre visible del álbum
 └── fotos/                 # imágenes físicas del álbum
```

`usuarios.json` — clave = email/identificador del usuario:

```json
{
  "dueno@correo.com":   { "rol": "admin",        "permisos": { "subir": true,  "borrar": true,  "modificar": true } },
  "invitado_juan":      { "rol": "colaborador",  "permisos": { "subir": true,  "borrar": false, "modificar": false } }
}
```

`invitaciones.json` — clave = token secreto:

```json
{
  "token_secreto_abc123": { "rol": "colaborador", "permisos": { "subir": true, "borrar": false, "modificar": false }, "expiracion": "indefinida" }
}
```

`album.json` — nombre visible del álbum (se comparte como `reader`; el invitado lo lee para mostrarlo en «Mis álbumes»):

```json
{ "nombre": "Cumple de Ana", "dueno": "dueno@correo.com", "creado": "2026-10-30T10:00:00.000Z" }
```

Si un JSON/carpeta no existe en el Drive del dueño al iniciar sesión, crearlo automáticamente. `album.json` solo se rellena si está vacío: nunca pisa un nombre ya elegido.

## Roles y permisos

- **Admin (dueño):** control total (subir/borrar/modificar), gestiona `usuarios.json` e `invitaciones.json`, genera invitaciones.
- **Colaborador:** entra por enlace de invitación; ve la galería y sube fotos según permisos; no borra/modifica a menos que se lo otorguen.
- **Visitante (opcional):** solo lectura, sin subir.

Toda foto siempre se guarda en `fotos/`. Los permisos se validan contra `usuarios.json` del Drive destino antes de cualquier GET/POST.

## Flujos clave (implementar tal cual)

1. **Login:** botón "Registrarse"/"Iniciar sesión" en la portada → OAuth 2.0 (`drive`) → redirige a `/albumes.html` («Mis álbumes»). Desde el hub, el dueño abre su álbum personal; al hacerlo se verifica/crea `MiAlbumWeb_Config/` + JSONs y se comparten `usuarios.json`/`invitaciones.json`/`album.json`/`fotos/` para invitados.
2. **Invitaciones (página `ajustes.html`, solo dueño):** el admin elige rol/permisos → la app genera token único, lo guarda en `invitaciones.json` y crea la URL con el origen real:
   `https://<origen-actual>/album.html?drive=ID_DRIVE_DUENO&token=TOKEN_SECRETO&inv=…&users=…&fotos=…&album=…`
   - `album` es opcional: los enlaces emitidos antes de `album.json` siguen funcionando.
   - Generar QR en pantalla para compartir por móvil.
   - Al entrar: login con scope `drive`, validar token contra `invitaciones.json`, pedir nombre al invitado, registrarlo en `usuarios.json` y añadir el álbum a la lista local.
3. **Ver fotos:** GET a Drive filtrando archivos dentro de `fotos/`, renderizar galería responsiva. Funciona igual para el dueño y para el invitado porque ambos usan el scope `drive` sobre la carpeta compartida.
4. **Subir:** procesar imagen en cliente → POST a Drive en `fotos/` → actualizar UI al instante.
5. **Álbumes múltiples (`/albumes.html`):** el hub muestra el álbum personal (siempre `/album.html` sin `drive`) y los álbumes compartidos guardados en `localStorage` bajo `MiAlbumWeb_albumes`. La lista nunca guarda tokens. «Unirme con un enlace» pega una URL o QR y navega a `album.html` conservando la query.
6. **Volver a un álbum ya unido:** `enlaceAlbum()` construye `/album.html?drive=…&inv=…&users=…&fotos=…&album=…` sin token. Al abrirlo se detecta el modo por la presencia de `drive` y la pertenencia se valida contra `usuarios.json`; si la persona ya no está ahí, se muestra el error y la opción «Quitar de mi lista».
7. **Salir de un álbum:** desde el hub o desde la cabecera del álbum, el invitado elimina su propia entrada de `usuarios.json`, borra la fila local y vuelve a `/albumes.html`. No cierra la sesión. El admin no puede salir de su propio álbum.

## Restricciones y gotchas

- **Sin backend tradicional:** toda la lógica corre en el navegador (JS vainilla), conectándose directo a la API REST de Drive con el token OAuth del usuario activo. No introducir servidores, funciones serverless propias ni bases de datos centrales. **Dependencias y build tools sí están permitidas** (criterios en «Convenciones de código»).
- OAuth scope: único `drive` para dueño e invitado (ver «Concepto»). No volver a `drive.file`: rompe la visibilidad de las fotos subidas por otras cuentas.
- Los archivos compartidos lo están como `anyone` (`writer` en `fotos/` y `usuarios.json`, `reader` en `invitaciones.json` y `album.json`) porque no hay backend que gestione permisos por email. El token de invitación protege la app, no el acceso directo a Drive: documentarlo como limitación.
- Al compartir, no silenciar errores: `compartirAlbum()` verifica el permiso real y el panel de ajustes muestra el aviso (`album.avisoCompartir`).
- Las claves de estado/roles están en español (`usuarios.json`, `invitaciones.json`, `album.json`, `fotos/`, `admin`, `colaborador`): mantener la nomenclatura tal cual.
- Los tokens viajan en la query string (`?drive=...&token=...`): el token es la única autorización del colaborador, nunca hardcodearlo ni loguearlo. `album.html` sin token solo funciona para quien ya está en `usuarios.json`.
- Las fotos subidas por un invitado son suyas en Drive: gastan su cuota y desaparecen si esa persona las borra. `DriveApi.borrar()` hace `DELETE`; si Drive responde 403 (archivo de otra cuenta) manda a la papelera con `PATCH {trashed:true}`. El dueño no puede borrar de forma permanente lo ajeno.
- El invitado puede editar `usuarios.json` (está como `writer`) y por tanto los permisos de otras personas. Es una limitación heredada de no tener backend.
- Salir de un álbum borra solo la entrada propia de `usuarios.json` y la fila local; no borra fotos ni cierra la sesión. El admin no puede salir de su propio álbum.