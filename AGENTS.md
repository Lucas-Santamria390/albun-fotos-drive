# AGENTS.md

Estado actual: **implementado y desplegado**. Este archivo es la especificación del proyecto y las convenciones vigentes. La base de código se organiza en módulos ES y CSS dividido por responsabilidad. **Sin backend propio (fundamental)**; dependencias y build tools SÍ están permitidas cuando aportan valor real (criterios abajo).

Despliegue: `https://mialbumweb.netlify.app` (Netlify drag & drop). Al cambiar código, volver a subir la carpeta raíz del repo.
ClientId OAuth: `622196535234-ddrlisjppqaivef385ncm17jvi22pojk.apps.googleusercontent.com` (origen autorizado incluye `https://mialbumweb.netlify.app`). La app NO se envía a verificación de Google (se usa tal cual).

## Estructura de archivos

```
index.html · album.html · ajustes.html · privacidad.html   # páginas; cada una carga 1 solo <script type="module">
css/                                       # dividido por responsabilidad
 ├── base.css        # reset, variables (claro/oscuro), animaciones, utilidades
 ├── layout.css      # cabezo, contenedores, hero, tarjetas, pie
 ├── components.css  # botones, chips, etiquetas, campos, listas, estadísticas, invitaciones
 ├── gallery.css     # toolbar, buscador/orden, grilla, foto, skeleton, estados vacíos
 ├── upload.css      # zona de subida, drag&drop, progreso
 ├── modal.css       # capas, modales, lightbox
 ├── toast.css       # notificaciones
 └── responsive.css  # media queries
js/
 ├── config.js       # CONFIG (clientId, scope, raíz, mimes, memo con IDs del Drive destino)
 ├── theme.js        # applyTema/initTema (localStorage "malbum-tema")
 ├── util.js         # $, $$, toast, ICONOS
 ├── auth.js         # AUTH: token en sessionStorage + login OAuth + quienSoy/salir
 ├── drive/
 │   ├── api.js      # DriveApi: capa REST de Drive (get/post/list/leer/borrar/subir/…compartir)
 │   └── structure.js# asegurarEstructura() (crea MiAlbumWeb_Config y JSONs) + compartirAlbum()
 ├── album/
 │   ├── state.js    # estado de sesión (rol/permisos/fotos/caché/filtros) + cargarJson/cargarFotos/visibles
 │   ├── sesion.js   # helpers de sesión compartidos: salir, prepararSesion, renderSesion, mostrarGateError
 │   ├── gallery.js  # render de galería (tarjetas, imágenes, búsqueda/orden, contador)
 │   ├── lightbox.js # visor con teclado y descarga
 │   ├── upload.js   # subida con progreso (dropzone + input)
 │   ├── borrar.js   # borrado de fotos con confirmación (individual o en lote)
 │   ├── seleccion.js # modo selección múltiple: entrar/salir, marcar y barra de acciones
 │   ├── admin.js    # panel admin: iniciarOwner, stats, usuarios, invitaciones, QR, revocar
 │   ├── ajustes.js  # punto de entrada de ajustes.html (solo dueño)
 │   └── controller.js # punto de entrada del álbum: login, flujos owner/invitado, delegación de eventos
 ├── index.js        # punto de entrada de la portada
```

## Convenciones de código

- **JS en módulos ES** (`export`/`import`, con extensión `.js`). Cada página carga un único `<script type="module">`. Sin `type="module"` no funcionan los `import`; al probar en local se necesita servidor (no abrir `file://`).
- Los módulos de dominio (`drive/`, `auth`) no tocan el DOM; las vistas (`album/`) sí.
- `drive/api.js` y `drive/structure.js`: `this` válido solo invocando métodos como `DriveApi.x()`; no pasar métodos sueltos sin binder.
- El estado vive en `album/state.js`; los módulos lo importan (sin módulo de eventos/`this`).
- `CONFIG.memo` se llena con `asegurarEstructura()`: `{ raiz, inv, users, fotos }`. La URL de invitación lleva `drive`, `token`, `inv`, `users`, `fotos`.
- Verificar sintaxis ESM sin tocar el repo: copiar los `.js` a `.mjs` temporales y `node --check`.
- **Dependencias y build tools:** permitidas solo si aportan valor real. Criterios para añadir una:
  1. Realmente necesaria (resolver un problema que el navegador/estándar no resuelva bien).
  2. Madura, mantenida y open source.
  3. Sin dependencias duplicadas ni paquete excesivamente grande para una función simple.
  4. Documentarla en README (para qué y por qué).
  Ejemplos plausibles según el plan: ESLint, Prettier, Vitest, Testing Library, Playwright, generación de QR local, build/despliegue de Netlify. NO añadir herramientas "por defecto"; decidir caso a caso.
- Front-end en español salvo navegación técnica del navegador. La portada (`index.html`) NO debe mostrar detalles técnicos (nada de "sin servidores", "Drive", "base de datos", "HTML5+CSS3+JS") — copy pensada para el usuario final.

## Concepto

Álbum de fotos colaborativo **100% serverless y descentralizado**. No hay backend ni base de datos central: el frontend estático (HTML5 + CSS3 + **JavaScript vainilla**; el core es JS puro, con librerías/build tools opcionales cuando aporten valor real) alojado en **Netlify** habla directamente con la API REST de **Google Drive**. Cada usuario dueño usa su propia cuenta de Google Drive como servidor de almacenamiento y "base de datos" en archivos JSON.

> Nota: la base sigue siendo JavaScript vainilla; se permiten añadir librerías/build tools cuando aporten valor real (criterios en «Convenciones de código»), sin cambiar la arquitectura.

- Hosting: Netlify (free tier, URL `*.netlify.app`).
- Auth: **Google OAuth 2.0** con scope único `https://www.googleapis.com/auth/drive.file`.
- Cero costos: solo capa gratuita de Netlify + Drive personal de cada usuario.

## Estructura de datos (Drive de cada dueño)

Todo el "backend" vive dentro de cada Drive personal del dueño del álbum:

```
MiAlbumWeb_Config/          ← carpeta raíz creada automáticamente en el Drive del dueño
 ├── usuarios.json          # usuarios autorizados + roles/permisos
 ├── invitaciones.json      # tokens de invitación activos
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

Si un JSON/carpeta no existe en el Drive del dueño al iniciar sesión, crearlo automáticamente.

## Roles y permisos

- **Admin (dueño):** control total (subir/borrar/modificar), gestiona `usuarios.json` e `invitaciones.json`, genera invitaciones.
- **Colaborador:** entra por enlace de invitación; ve la galería y sube fotos según permisos; no borra/modifica a menos que se lo otorguen.
- **Visitante (opcional):** solo lectura, sin subir.

Toda foto siempre se guarda en `fotos/`. Los permisos se validan contra `usuarios.json` del Drive destino antes de cualquier GET/POST.

## Flujos clave (implementar tal cual)

1. **Login del dueño:** botón "Registrarse"/"Iniciar sesión" en la portada → OAuth 2.0 (`drive.file`) → verificar/crear `MiAlbumWeb_Config/` + JSONs.
2. **Invitaciones (página `ajustes.html`, solo dueño):** el admin elige rol/permisos → la app genera token único, lo guarda en `invitaciones.json` y crea la URL:
   `https://tu-album.netlify.app/album.html?drive=ID_DRIVE_DUENO&token=TOKEN_SECRETO`
   - Generar QR en pantalla para compartir por móvil.
   - Al entrar: validar token contra `invitaciones.json`, pedir nombre al invitado, registrarlo en `usuarios.json`.
3. **Ver fotos:** GET a Drive filtrando archivos dentro de `fotos/`, renderizar galería responsiva.
4. **Subir:** procesar imagen en cliente → POST a Drive en `fotos/` → actualizar UI al instante.

## Restricciones y gotchas

- **Sin backend tradicional:** toda la lógica corre en el navegador (JS vainilla), conectándose directo a la API REST de Drive con el token OAuth del usuario activo. No introducir servidores, funciones serverless propias ni bases de datos centrales. **Dependencias y build tools sí están permitidas** (criterios en «Convenciones de código»).
- OAuth scope: usar únicamente `drive.file` (mínimo acceso, solo a archivos creados por la app).
- Las claves de estado/roles están en español (`usuarios.json`, `invitaciones.json`, `fotos/`, `admin`, `colaborador`): mantener la nomenclatura tal cual.
- Los tokens viajan en la query string (`?drive=...&token=...`): el token es la única autorización del colaborador, nunca hardcodearlo ni loguearlo.