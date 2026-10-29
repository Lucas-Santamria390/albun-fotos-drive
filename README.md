# MiAlbumWeb

Álbum de fotos colaborativo **sin backend**: el frontend estático habla directamente con la API
REST de Google Drive usando OAuth 2.0 (`drive.file`). Cada dueño guarda su álbum en su propio
Drive como `MiAlbumWeb_Config/{usuarios.json, invitaciones.json, fotos/}`.

- Producción: <https://mialbumweb.netlify.app>
- Stack: **Astro** (MPA estático) + **Tailwind CSS v4** + **Svelte 5** (islas) + **TypeScript**.
- Sin servidores, sin base de datos, sin funciones serverless.

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

## Rutas

| URL                | Página                                  |
| ------------------ | --------------------------------------- |
| `/`                | Portada                                 |
| `/album.html`      | Álbum (dueño o invitado)                |
| `/ajustes.html`    | Panel del administrador                 |
| `/privacidad.html` | Política de privacidad                  |
| `/terminos.html`   | Términos de uso                         |
| `/ui.html`         | Catálogo interno de componentes (noindex) |

El build usa `build.format: "file"` a propósito: conserva las URLs `.html` y, con ellas, los enlaces
de invitación ya emitidos (`album.html?drive=…&token=…`).

## Arquitectura

```
src/
├─ layouts/Base.astro          # head, tema, cabecera/pie, toasts
├─ components/
│  ├─ ui/                      # Boton, Campo, Modal, Toast, InterruptorTema…
│  ├─ layout/                  # Cabecera, Pie, Contenedor
│  ├─ album/                   # AlbumApp, Galeria, FotoCard, Lightbox, ZonaSubida…
│  └─ ajustes/                 # AjustesApp (invitaciones, usuarios, QR)
├─ lib/
│  ├─ config.ts · tipos.ts · auth.ts · qr.ts
│  ├─ drive/                   # api.ts (REST) + structure.ts (carpetas y JSONs)
│  ├─ services/                # puros y testeables: permisos, invitaciones, galería, enlaces, texto
│  └─ stores/                  # estado con runes: album.svelte.ts, toast.svelte.ts
├─ pages/                      # index, album, ajustes, privacidad, terminos, 404, ui
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

Variables: `PUBLIC_GOOGLE_CLIENT_ID` es pública (viaja al cliente). Si no se define, se usa el
valor por defecto de `src/lib/config.ts`. Ver `.env.example`.

## Cabeceras

`public/_headers` aplica `Referrer-Policy: no-referrer` para que el token de invitación no se filtre
por el `Referer`, además de `nosniff`, `X-Frame-Options: DENY` y una `Permissions-Policy` restrictiva.

## Estructura de datos en Drive

No ha cambiado respecto a la versión anterior. Ver `AGENTS.md` para el contrato completo.
