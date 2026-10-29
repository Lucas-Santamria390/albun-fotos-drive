# AGENTS.md

Estado actual: **migrado a Astro + Tailwind + Svelte + TypeScript** (rama `feat/migracion-astro`). Este archivo es la especificación del proyecto y las convenciones vigentes. **Sin backend propio (fundamental)**; dependencias y build tools SÍ están permitidas cuando aportan valor real (criterios abajo).

Despliegue: `https://mialbumweb.netlify.app` (Netlify desde Git: `npm run build` → `dist/`). El legado de `js/` y `css/` se conserva temporalmente sin uso y se elimina al cerrar la migración.
ClientId OAuth: `622196535234-ddrlisjppqaivef385ncm17jvi22pojk.apps.googleusercontent.com` (origen autorizado incluye `https://mialbumweb.netlify.app`). La app NO se envía a verificación de Google (se usa tal cual).

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
 │   ├── ajustes/   # AjustesApp (invitaciones, usuarios, QR local)
 │   └── demo/      # DemoInteraccion para /ui
 ├── lib/
 │   ├── tipos.ts      # Foto, Usuario, Invitacion, Permisos, Rol, ArchivoDrive, MemoEstructura
 │   ├── config.ts     # CONFIG (clientId, scope, mimes, siteUrl, memo con IDs del Drive destino)
 │   ├── auth.ts       # AUTH: token en sessionStorage + login OAuth + quienSoy/salir
 │   ├── qr.ts         # QR local con uqr (SVG + data URL)
 │   ├── drive/
 │   │   ├── api.ts        # DriveApi: capa REST tipada (get/post/list/listarTodas/leer/borrar/subir…)
 │   │   └── structure.ts  # asegurarEstructura() + compartirAlbum()
 │   ├── services/     # puros, sin DOM ni red: permisos, invitaciones, galeria, enlaces, texto
 │   └── stores/       # estado con runes: album.svelte.ts, toast.svelte.ts
 ├── pages/            # index, album, ajustes, privacidad, terminos, 404, ui
 └── styles/           # tokens.css (variables claro/oscuro) + global.css (Tailwind v4)
tests/                 # Vitest sobre src/lib/services y qr
```

## Convenciones de código

- **TypeScript** en `src/lib` (estricto) y **Svelte 5 con runes** (`$state`, `$derived`, `$props`, `$effect`) en los componentes. Las páginas son `.astro`.
- Un único `<script type="module">` por página ya no aplica: el punto de entrada lo genera el build. En local hace falta servidor (`npm run dev`), nunca abrir `file://`.
- **Regla de dependencias:** `páginas → componentes → stores → services → drive/auth → config`. Ningún componente importa `drive/api` directamente.
- Los servicios (`src/lib/services`) son puros: sin DOM, sin red, sin estado global. Ahí van reglas como permisos, validación de invitaciones, filtros/orden y enlaces.
- El estado vive en `src/lib/stores/album.svelte.ts` (clase con runes). No crear estado paralelo en componentes.
- `drive/api.ts` y `drive/structure.ts`: `this` válido solo invocando métodos como `DriveApi.x()`; no pasar métodos sueltos sin binder.
- `CONFIG.memo` se llena con `asegurarEstructura()`: `{ raiz, inv, users, fotos }`. La URL de invitación lleva `drive`, `token`, `inv`, `users`, `fotos`; el token se codifica dentro de `enlaceInvitacion()` (nunca dos veces).
- Los módulos `.astro` no se pueden importar desde Svelte: los componentes compartidos dentro de islas deben ser `.svelte`.
- No usar `innerHTML` con datos no confiables. Para SVG estático de iconos se usa `set:html` solo con literales del propio código.
- `npm run check` y `npm test` deben pasar antes de commitear. `npm run build` debe generar `dist/` con `album.html` y `ajustes.html`.
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