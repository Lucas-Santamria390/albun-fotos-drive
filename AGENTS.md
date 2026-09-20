# AGENTS.md

Estado actual: **repo vacío** — no hay código todavía. Este archivo es la especificación del proyecto que hay que implementar. Consúltalo antes de escribir el primer archivo.

## Concepto

Álbum de fotos colaborativo **100% serverless y descentralizado**. No hay backend ni base de datos central: el frontend estático (HTML5 + CSS3 + **JavaScript vainilla**, sin frameworks ni build tools) alojado en **Netlify** habla directamente con la API REST de **Google Drive**. Cada usuario dueño usa su propia cuenta de Google Drive como servidor de almacenamiento y "base de datos" en archivos JSON.

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

1. **Login del dueño:** botón "Iniciar sesión con Google" → OAuth 2.0 (`drive.file`) → verificar/crear `MiAlbumWeb_Config/` + JSONs.
2. **Invitaciones:** el admin elige rol/permisos → la app genera token único, lo guarda en `invitaciones.json` y crea la URL:
   `https://tu-album.netlify.app/album.html?drive=ID_DRIVE_DUENO&token=TOKEN_SECRETO`
   - Generar QR en pantalla para compartir por móvil.
   - Al entrar: validar token contra `invitaciones.json`, pedir nombre al invitado, registrarlo en `usuarios.json`.
3. **Ver fotos:** GET a Drive filtrando archivos dentro de `fotos/`, renderizar galería responsiva.
4. **Subir:** procesar imagen en cliente → POST a Drive en `fotos/` → actualizar UI al instante.

## Restricciones y gotchas

- **Sin backend tradicional:** toda la lógica corre en el navegador (JS vainilla), conectándose directo a la API REST de Drive con el token OAuth del usuario activo. No introducir servidores, funciones serverless propias ni dependencias de build.
- OAuth scope: usar únicamente `drive.file` (mínimo acceso, solo a archivos creados por la app).
- Las claves de estado/roles están en español (`usuarios.json`, `invitaciones.json`, `fotos/`, `admin`, `colaborador`): mantener la nomenclatura tal cual.
- Los tokens viajan en la query string (`?drive=...&token=...`): el token es la única autorización del colaborador, nunca hardcodearlo ni loguearlo.