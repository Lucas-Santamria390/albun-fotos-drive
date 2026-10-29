# Plan de migración — Astro + Tailwind + Svelte + TypeScript

> **Estado:** en ejecución.
> **Rama:** `feat/migracion-astro`.
> **Base:** rama `refactorisacion`.
> **Objetivo:** migrar la capa de presentación a un framework, sin tocar el dominio ni el modelo de datos de Google Drive.
> **Restricción intacta:** sin backend propio, sin base de datos, sin funciones serverless.

---

## 1. Decisiones cerradas

| Decisión | Valor | Motivo |
|---|---|---|
| Framework de páginas | Astro 5 (`output: static`) | MPA real, cero JS por defecto, layouts y componentes |
| Sistema de estilos | Tailwind CSS v4 (plugin Vite + `@theme inline`) | Se apoya en los tokens CSS existentes, sin runtime |
| Interactividad | Svelte 5 (runes) | Compila a JS pequeño; estado reactivo sin librería extra |
| Lenguaje | TypeScript estricto en `src/lib` | Tipar `Usuario`, `Invitacion`, `Foto`, `Permisos` |
| Rutas | `build.format: "file"` | Conserva `album.html` y los enlaces de invitación ya emitidos |
| Despliegue | Netlify desde Git: `npm run build` → `dist/` | Deploy automático + previews por rama |
| Dominio | `https://mialbumweb.netlify.app` | No cambia el origen autorizado de OAuth |
| Backend | Ninguno | Decisión fundacional del proyecto |

**Se conserva sin cambios:** scope `drive.file`, estructura `MiAlbumWeb_Config/`, claves en español (`fotos`, `usuarios`, `invitaciones`, `admin`, `colaborador`), contrato de `DriveApi`.

---

## 2. Stack

| Pieza | Función |
|---|---|
| `astro` | Páginas, layouts, build estático, SEO |
| `@astrojs/svelte` + `svelte` | Islas interactivas (álbum, ajustes, tema, toasts, modales) |
| `tailwindcss` + `@tailwindcss/vite` | Utilidades y capa de componentes |
| `typescript` + `@astrojs/check` + `svelte-check` | Verificación de tipos |
| `uqr` (~2 KB) | QR local; elimina el tercero `api.qrserver.com` |
| `vitest` (ya instalado) | Tests del dominio |
| `@playwright/test` (fase posterior) | E2E y paridad visual |

**Descartado:** React, Bootstrap, DaisyUI, router SPA, backend.

---

## 3. Arquitectura objetivo

```
src/
├─ layouts/
│  └─ Base.astro                 # head, tema (is:inline), cabecera, pie, toasts
├─ components/
│  ├─ ui/                        # Boton, Campo, Chip, Tarjeta, Modal, Toast,
│  │                             # Skeleton, EstadoVacio, EstadoError, InterruptorTema
│  ├─ layout/                    # Cabecera, Pie, Contenedor
│  ├─ acceso/                    # BotonLogin, GuardiaSesion
│  ├─ album/                     # AlbumApp, Galeria, FotoCard, Lightbox,
│  │                             # ZonaSubida, BarraSeleccion, ConfirmarBorrado
│  └─ ajustes/                   # AjustesApp, PanelAdmin, ListaUsuarios,
│                                # ListaInvitaciones, GeneradorInvitacion, CodigoQR
├─ lib/
│  ├─ config.ts                  # CONFIG + PUBLIC_GOOGLE_CLIENT_ID
│  ├─ tipos.ts                   # Foto, Usuario, Invitacion, Permisos, Rol, DriveFile
│  ├─ auth.ts                    # OAuth + sessionStorage + quienSoy
│  ├─ drive/api.ts               # mismo contrato, tipado
│  ├─ drive/structure.ts
│  ├─ services/                  # puros, sin DOM ni red
│  │  ├─ permisos.ts · invitaciones.ts · galeria.ts · enlaces.ts
│  ├─ acciones/                  # casos de uso
│  ├─ stores/                    # estado con runes
│  │  ├─ album.svelte.ts · sesion.svelte.ts · tema.svelte.ts · toast.svelte.ts
│  └─ qr.ts                      # SVG local
├─ pages/                        # index · album · ajustes · privacidad · terminos · 404
└─ styles/
   ├─ tokens.css                 # fuente única de color, radio, sombra, movimiento
   └─ global.css                 # @import "tailwindcss" + @theme inline + @layer components
```

### Reglas de dependencia

```
páginas → componentes → stores → acciones → services → drive/auth → config
```

- Ningún componente importa `drive/api` directamente.
- Los servicios son puros: sin DOM, sin red, sin estado global.
- El estado vive en stores (`$state`, `$derived`).
- El tema se aplica antes del primer pintado con `<script is:inline>`.
- Nada de `innerHTML` con datos no confiables.

### Flujo de datos

```
evento en componente → acción → (servicio puro + DriveApi) → store → re-render
```

---

## 4. Mapa de migración

| Actual | Destino |
|---|---|
| `index.html` | `src/pages/index.astro` |
| `album.html` | `src/pages/album.astro` + `AlbumApp.svelte` |
| `ajustes.html` | `src/pages/ajustes.astro` + `AjustesApp.svelte` |
| `privacidad.html` | `src/pages/privacidad.astro` |
| — | `src/pages/terminos.astro`, `src/pages/404.astro` |
| `js/config.js` | `src/lib/config.ts` |
| `js/auth.js` | `src/lib/auth.ts` |
| `js/drive/api.js` | `src/lib/drive/api.ts` |
| `js/drive/structure.js` | `src/lib/drive/structure.ts` |
| `js/services/*.js` | `src/lib/services/*.ts` |
| `js/services/album.js` + `js/album/state.js` | `src/lib/stores/album.svelte.ts` + `src/lib/acciones/` |
| `js/album/gallery.js` | `Galeria.svelte` + `FotoCard.svelte` |
| `js/album/lightbox.js` | `Lightbox.svelte` |
| `js/album/upload.js` | `ZonaSubida.svelte` |
| `js/album/seleccion.js` | `BarraSeleccion.svelte` |
| `js/album/borrar.js` | `ConfirmarBorrado.svelte` |
| `js/album/admin.js` | `PanelAdmin.svelte` + hijos |
| `js/album/sesion.js` | `Cabecera.astro` + `lib/sesion.ts` |
| `js/album/controller.js` | `AlbumApp.svelte` |
| `js/album/ajustes.js` | `AjustesApp.svelte` |
| `js/index.js` | `BotonLogin.svelte` |
| `css/base.css` | `styles/tokens.css` + `global.css` |
| `css/layout.css` | `layouts/Base.astro` + `components/layout/*` |
| `css/components.css` | `components/ui/*` + `@layer components` |
| `css/gallery|upload|modal|toast|responsive.css` | Componentes y utilidades |
| `tests/*.js` | `tests/*.test.ts` |
| `js/**`, `css/**`, `*.html` | Se eliminan en F8 (la historia queda en git) |

---

## 5. Sistema de diseño

- **Color semántico:** `fondo`, `superficie`, `superficie-2`, `borde`, `texto`, `suave`, `primario`, `primario-2`, `primario-suave`, `peligro`, `exito`, `aviso` (+ `-suave`). Claro y oscuro con los mismos nombres.
- **Tipografía:** familia variable autoalojada; escala 1.25 → 12/14/16/20/25/31/39.
- **Espaciado:** base 4 px.
- **Radios:** 8 / 12 / 16 / full.
- **Sombras:** `sm`, `md`, `lg` + anillo de foco.
- **Movimiento:** 150 / 250 / 400 ms; `prefers-reduced-motion` respetado.
- **Breakpoints:** 480 / 768 / 1024 / 1280.

### Inventario de componentes

| Componente | Variantes / estados | Accesibilidad |
|---|---|---|
| `Boton` | prim / sec / ghost / peligro × sm/md/lg, `cargando`, `disabled` | `<button>` o `<a>` reales, foco visible |
| `Campo` | texto, fecha, select, checkbox | `<label>` asociado, error con `aria-describedby` |
| `Chip` | admin / colaborador / visitante | texto además de color |
| `Tarjeta` | normal / interactiva | — |
| `Modal` | confirmación, formulario | `role="dialog"`, `aria-modal`, focus trap, Esc |
| `Toast` | ok / error / info | `aria-live="polite"` |
| `Skeleton` | foto, texto | `aria-hidden` |
| `EstadoVacio` | con CTA | mensaje + acción |
| `EstadoError` | con reintento | `role="alert"` |
| `InterruptorTema` | claro / oscuro | `role="switch"` + `aria-checked` |
| `Galeria` / `FotoCard` | normal, seleccionada, fallo | `alt` real, navegación por teclado |
| `Lightbox` | 1..n fotos, descarga | flechas, Esc, foco |
| `ZonaSubida` | reposo, drag, subiendo, error | input accesible |
| `CodigoQR` | generar, descargar | SVG local |

---

## 6. Fases

| Fase | Contenido | Criterio de salida | Estado |
|---|---|---|---|
| **F0** | Rama, Netlify desde Git, baseline visual, `.env.example` | Preview + baseline | 🟡 falta configurar Netlify desde Git |
| **F1** | Dominio a TypeScript (config, tipos, auth, drive, services) + tests | `npm test` verde, `astro check` limpio | ✅ 38 tests verdes |
| **F2** | Astro + Tailwind + tokens + `Base.astro` + kit `ui/` + página `/ui` | Sistema de diseño navegable | ✅ `/ui` publicado |
| **F3** | Landing completa, privacidad, términos, 404, SEO/OG | 4 páginas estáticas, Lighthouse ≥ 95 | ✅ falta medir Lighthouse |
| **F4** | Álbum: store, galería, lightbox, subida, selección, borrado, filtros | Paridad funcional | ✅ smoke test manual pendiente |
| **F5** | Ajustes: usuarios, invitaciones, QR local, stats | Panel completo sin terceros | ✅ QR generado en local con `uqr` |
| **F6** | Sesión, tema, errores 401/red, env | Sin cierres de sesión indebidos | ✅ implementado, verificación manual pendiente |
| **F7** | Playwright E2E + visual + axe + matriz responsive | Suite verde | ⬜ no empezada |
| **F8** | README, AGENTS, limpieza del legado, deploy de producción | Build verde y producción actualizada | 🟡 README y AGENTS hechos; falta borrar legado y desplegar |

**Estimación total:** ≈18–19 jornadas de trabajo humano.

### Estado real al cerrar esta entrega

Lo construido en la rama `feat/migracion-astro` cubre **F1–F6** y la parte documental de **F8**:

- `npm run check` → 0 errores / 0 warnings (Astro + Svelte).
- `npm test` → 38 tests en 6 archivos.
- `npm run build` → 7 rutas en `dist/` (`index`, `album`, `ajustes`, `privacidad`, `terminos`, `ui`, `404`).
- `npm run preview` responde 200 en todas ellas.

Queda pendiente, sin bloquear la revisión:

1. **F0/F8 despliegue:** conectar el repo a Netlify desde Git (build `npm run build`, publish `dist`) y desplegar. El deploy actual sigue siendo el estático antiguo.
2. **F7 calidad:** Playwright (E2E de login/subida/borrado + visual + axe) y matriz responsive.
3. **F8 limpieza:** borrar `js/`, `css/`, `*.html` de la raíz y los tests `.test.js` ya sustituidos (la historia queda en git).
4. **Verificación manual con Google real:** OAuth exige que el origen del deploy preview esté autorizado en Google Cloud (no admite comodines).

**Sobre el commit / PR:** el modo de publicación cambia de «subir la raíz del repo» a «Netlify construye `npm run build` y publica `dist/`» (o subir `dist/` a mano). Hay que decirlo explícitamente al fusionar.

### Definición de terminado por fase

1. `npm run lint` sin errores.
2. `npm run check` (Astro + Svelte) sin errores.
3. `npm test` verde.
4. `npm run build` genera `dist/` con las rutas esperadas.
5. Deploy preview funcional.
6. Checklist manual del flujo tocado.

---

## 7. Netlify, OAuth y variables

**`netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

**`astro.config.mjs`**

```js
export default defineConfig({
  site: "https://mialbumweb.netlify.app",
  build: { format: "file" },
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] }
});
```

**Variables**
- `PUBLIC_GOOGLE_CLIENT_ID`: público, obligatorio. Hay un valor por defecto en `src/lib/config.ts` para no romper el build.
- `.env.example` versionado; `.env` ignorado.

**OAuth**
- El origen de producción no cambia.
- Para previews: usar el branch deploy estable (`<rama>--mialbumweb.netlify.app`) y añadirlo una vez como origen autorizado (Google no admite comodines).
- Los enlaces `album.html?drive=…&token=…&inv=…&users=…&fotos=…` siguen funcionando gracias a `build.format: "file"`.

**Cabeceras (`public/_headers`)**
- `Referrer-Policy: no-referrer` para no filtrar el token de la URL.
- `X-Content-Type-Options: nosniff`.
- CSP primero en `Report-Only`, luego `enforce` tras validar OAuth y QR.

---

## 8. Testing

| Nivel | Herramienta | Cobertura |
|---|---|---|
| Unitario | Vitest | permisos, invitaciones (token/expiración), galería (filtro/orden), enlaces, QR |
| Acciones | Vitest + mock de `DriveApi` | subir, borrar, invitar, revocar |
| E2E | Playwright | token inyectado + `page.route` a `googleapis.com` |
| Visual | Playwright screenshots | 4 páginas × 2 temas × 2 viewports |
| A11y | axe-core | sin violaciones críticas |
| CI | GitHub Actions | lint + check + test + build |

No se automatiza el popup real de Google; se valida a mano en producción.

---

## 9. Deuda que se cierra en la migración

- `services/album.js` duplicando `album/state.js` → store + acciones.
- Header repetido en 4 HTML → `Base.astro`.
- `.avatar` duplicado en CSS → componente único.
- Vistas llamando a `DriveApi` → acciones.
- Blobs sin `revokeObjectURL` → caché centralizada.
- Sin miniaturas → `thumbnailLink` en la grilla.
- Sin paginación → `nextPageToken`.
- QR en servicio externo → `uqr` local.
- `aria-checked` del tema → estado reactivo.
- Modales sin focus trap → `Modal.svelte`.
- Sin README, 404 ni términos → F3 y F8.
- Token filtrable por referrer → `no-referrer`.

---

## 10. Fuera de alcance

- Multi-álbum / carpetas múltiples.
- Backend, base de datos, funciones serverless.
- Verificación de Google / publicación masiva.
- Comentarios, likes, feed público, edición de imágenes.
- App nativa.
- Cambiar el modelo de autorización de Drive.

---

## 11. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Regresiones al reescribir vistas | Baseline visual + fases con paridad |
| Sobre carga de stack nuevo | F1 (dominio) y F2 (UI) independientes y verificables |
| Enlaces de invitación antiguos | `build.format: "file"` + prueba E2E con enlace real |
| OAuth en previews | Branch deploy estable registrado en Google |
| `preflight` altera estilos | Comparación visual; overrides puntuales documentados |
| Pérdida de la "filosofía vanilla" | El dominio queda fuera del framework |
| Deploy roto en producción | Publicar tras F7; rollback con "Publish deploy" |
| Scope creep | Este plan no incluye multi-álbum ni rediseño de datos |

---

## 12. Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-28 | Adoptar Astro + Tailwind + Svelte + TS | El usuario autorizó framework y reescritura completa |
| 2026-10-28 | Build en Netlify desde Git | Deploy automático y previews por rama |
| 2026-10-28 | Dominio y modelo de datos sin cambios | No romper álbumes ni enlaces existentes |
| 2026-10-28 | Dominio en TS puro, presentación en framework | Mantener testeabilidad y evitar lock-in |
