# PLAN DE TRABAJO - REFACTORIZACIÓN

Este archivo es el control de ejecución de la refactorización. La especificación/reglas viven en `refactorisacion.md`. Trabajar por fases en orden; después de cada bloque de cambios: probar → corregir → commit corto.

## Reglas de trabajo

- Una fase a la vez. No avanzar a la siguiente sin aprobar la anterior.
- Después de cada cambio importante: verificar sintaxis ESM (copiar `.js` a `.mjs` temporales y `node --check`), revisar manualmente, commit corto.
- NO agregar dependencias ni build tools (restricción de `AGENTS.md`).
- NO eliminar funcionalidades existentes.
- Decisiones importantes → anotarlas abajo en "Registro de decisiones".

---

## Fase 1 — Auditoría

- [x] Analizar toda la estructura actual del proyecto (HTML, CSS, JS).
- [x] Identificar código duplicado.
- [x] Identificar código spaghetti / módulos demasiado grandes.
- [x] Identificar funciones con demasiadas responsabilidades.
- [x] Identificar lógica de negocio mezclada con UI.
- [x] Identificar problemas de estado.
- [x] Identificar problemas de naming y organización de archivos.
- [x] Identificar problemas de accesibilidad.
- [x] Identificar problemas responsive.
- [x] Identificar problemas de seguridad.
- [x] Identificar problemas de rendimiento.
- [x] Identificar problemas de mantenibilidad.
- [x] Listar funcionalidades existentes que DEBEN conservarse.
- [x] NO modificar partes críticas en esta fase.
- [x] Entregar informe de auditoría para revisión.

### Hallazgos de la auditoría

Verificados el 2026-09-24. Sintaxis ESM: OK (17 módulos, node --check).

**SEGURIDAD (prioridad)**

1. **XSS por búsqueda** — `js/album/gallery.js:84-87`: `state.txBusqueda` se inserta con `innerHTML` ("No hay resultados para…"). Entrada del usuario sin escapar → XSS reflejado. CRÍTICO.
2. **Autorización basada en archivos JSON compartidos con "anyone"** — `js/drive/structure.js:30-33` + `drive/api.js:113-115`: `usuarios.json` (writer), `invitaciones.json` (reader) y `fotos/` (writer) se comparten con `type:"anyone"`. Cualquiera con los IDs puede leer/escribir; el único "secreto" es el token que viaja en la URL. Además, al ser `usuarios.json` "writer" para cualquiera, un atacante puede auto-registrarse sin invitación. Es una limitación inherente a una app 100% frontend (no hay autoridad real de autorización). REVISAR y documentar; ver restricción en refactorisacion.md.
3. **Token OAuth en localStorage** — `js/auth.js:9,35`: los access tokens en localStorage quedan expuestos a cualquier XSS y persisten. Mejor `sessionStorage` (token de corta duración sin refresh).
4. **QCódigo QR externo** — `js/album/admin.js:176`: `api.qrserver.com` genera el QR recibiendo el enlace de invitación completo (incluye el token) → un tercero ve el enlace. Considerar alternativas (QR local) o documentarlo.
5. **`mostrarGateError` cierra sesión** — `js/album/sesion.js:46-51`: ante cualquier error (incluso un fallo de red pasajero) borra el token y saca al usuario. UX/seguridad discutible.
6. **Sin límite de tamaño/subida** ni validación explícita de extensión (solo `f.type`) — `js/album/upload.js:37-43`.
7. **`cargarJson` traga errores** — `js/album/state.js:47-54`: si el archivo de Drive no es accesible devuelve `{}` → se muestra "álbum vacío" en vez de error.
8. **Token de invitación en query string** — queda en historial/refefrers. Documentado como mecanismo de acceso en AGENTS.md (aceptado), pero mantener pendiente de revisión.

**ARQUITECTURA / CÓDIGO**

9. **`AUTH` mezcla responsabilidades** — `js/auth.js`: storage del token + cliente OAuth + `quienSoy` (llama a Drive API) + inyección de script. Separar (servicio de auth + servicio de perfil).
10. **`DriveApi.subirArchivo` es código muerto** — `js/drive/api.js:51-62`: nunca se usa (solo existe `subirConProgreso`).
11. **Lógica de invitaciones dispersa** — validación del token en `controller.js`, gestión en `admin.js`, permisos por defecto repetidos en 3 sitios. Extraer servicio de invitaciones puro y testeable.
12. **Magic strings repetidos** — "indefinida", "colaborador", "admin", claves de permisos, `application/vnd.google-apps.folder`. Centralizar constantes.
13. **Caché de blobs sin revocar** — `js/album/state.js` / `gallery.js:41-59`: `state.cache` acumula object URLs y `cargarGaleria` la resetea sin `URL.revokeObjectURL` → posible fuga de memoria con galerías grandes.
14. **Sin paginación/carga incremental** — `api.js:35` `pageSize=1000`; la grilla descarga el blob completo de cada foto (`fotoUrl`) ignorando `thumbnailLink` → coste alto en álbumes grandes.
15. **Búsqueda re-renderiza todo por tecla** — `controller.js:157-160` sin debounce; `renderGaleria` reconstruye el DOM completo.
16. **CSS duplicado** — `.avatar` está en `layout.css:43` y `components.css:152`.
17. **`privacidad.html` carga CSS sin usar** — gallery/upload/modal (`privacidad.html:10-12`).
18. **`salirDeSeleccion` === `cancelarSeleccion`** — alias duplicado (`seleccion.js:12-21`).

**UX/UI / ACCESIBILIDAD**

19. **`initTema` no actualiza `aria-checked`** al alternar el interruptor (`theme.js:8-17`).
20. **Modales sin focus trap ni `aria-labelledby`**; la lightbox tampoco mueve el foco (solo cierre con Esc y flechas, que está bien).
21. **Alt genérico en lightbox** (`alt="Foto del álbum"`), `album.html:188`.
22. **Dos `h1` en index** (`index.html:32,58`); heads inconsistentes entre páginas (meta description/favicon faltan en `album.html` y `privacidad.html`).
23. **Estado vacío/error de galería** tratan un fallo de Drive como "álbum vacío" (relacionado con #7).
24. **Sin estados de error globales**: errores de red/carga solo vía toast o gate con sesión cerrada (#5).

**RENDIMIENTO / SEO**

25. Landing mínima (hero + 3 tarjetas) sin secciones del §3 ($cómo funciona, FAQ, benefits…); footer sin enlaces a legal/contacto; no hay 404 ni Términos.
26. Sin README, sin `.gitignore`, sin tests, sin lint ni build (por restricción de AGENTS.md).
27. `clientId` hardcodeado en `js/config.js:2` — es público y necesario en SPA; sin build tools no hay `.env` real. Documentar (`.env.example` solo como referencia).

**Riesgos de refactorización**

- Tocar `structure.js`/`api.js` puede romper datos ya existentes en Drive (IDs en memo). Conservar contratos.
- Cambiar localStorage→sessionStorage cambia la persistencia: usuarios que vuelven en otra sesión del navegador tendrán que re-loguear (aceptable; avisar según prioridad seguridad).
- La seguridad de invitaciones NO se puede arreglar del todo sin backend: el objetivo será endurecer (revocación rápida, tokens más largos, no exponer `users`/`fotos` si es posible) y documentar la limitación.

### Funcionalidades a conservar

- Login OAuth `drive.file` y sesión persistente.
- Estructura `MiAlbumWeb_Config/` (`usuarios.json`, `invitaciones.json`, `fotos/`) auto-creada.
- Galería con búsqueda, orden, contador, modo selección múltiple.
- Lightbox con teclado, navegación y descarga.
- Subida drag&drop con progreso por archivo.
- Borrado individual y en lote con confirmación.
- Invitaciones con rol/permisos, expiración, revocación y enlace + QR.
- Página de ajustes con estadísticas, usuarios e invitaciones (solo dueño).
- Tema claro/oscuro persistido.
- Flujo de invitado por query (`?drive=…&token=…`).
- Redirección automática de portada a álbum si ya hay sesión.
- Entrada directa por enlace de invitación → nombre → galería.

---

## Fase 2 — Plan

- [x] Proponer nueva estructura de carpetas.
- [x] Definir arquitectura.
- [x] Definir componentes reutilizables.
- [x] Definir servicios.
- [x] Definir flujo de datos.
- [x] Definir estrategia de autenticación.
- [x] Definir estrategia de Google Drive.
- [x] Definir estrategia de testing (sin framework, respetando la restricción).
- [ ] Revisar y aprobar el plan con el usuario antes de tocar código.

### Estructura de carpetas propuesta

La base actual ya es buena (módulos ES + CSS por responsabilidad). Cambios moderados: separar **servicios** (sin DOM, lógicos) de **vistas** (DOM) y **controladores** de página.

```
js/
├── config.js              # CONFIG + CONSTANTES (roles, permisos, mimes, expiraciones)
├── theme.js               # tema claro/oscuro (+ fix aria-checked)
├── util.js                # $, $$, toast, mostrar/ocultarCarga
├── services/              # SIN DOM → no importan util/views
│   ├── auth.js            # OAuth: token en sessionStorage, login/logout, manejo 401
│   ├── perfil.js          # quienSoy (extraído de auth)
│   ├── drive/
│   │   ├── api.js         # REST Drive (contrato se conserva)
│   │   └── structure.js   # asegurarEstructura + compartir (revisar permisos)
│   ├── invitaciones.js    # crear/validar/revocar/expiración (lógica pura, testeable)
│   ├── permisos.js        # puedeSubir/puedeBorrar y comprobaciones (puro)
│   └── album.js           # estado del álbum + cargarFotos + visibles(filtro/orden) + caché
├── views/                 # DOM: render de UI
│   ├── nav.js             # cabecera + menú móvil (elimina HTML duplicado)
│   ├── sesion.js          # chip de sesión + rol
│   ├── galeria.js         # grilla, estados vacío/error/skeleton
│   ├── lightbox.js
│   ├── upload.js
│   ├── borrar.js
│   ├── seleccion.js
│   ├── ajustes.js         # panel del dueño (cuenta/privacidad/invitaciones/QR)
│   └── modal.js           # abrir/cerrar accesibles + focus trap
└── pages/                 # entradas de página (controladores ligeros)
    ├── index.js
    ├── album.js
    └── ajustes.js

tests/                     # tests unitarios con motor de Node (node --test), sin dependencias
    ├── invitaciones.test.mjs
    ├── permisos.test.mjs
    ├── album.test.mjs
    └── run.ps1            # copia módulos a .mjs y ejecuta node --check + node --test
```

Se mantienen los nombres/claves en español del dominio (`usuarios.json`, `invitaciones.json`, `fotos/`, `admin`, `colaborador`).

### Arquitectura propuesta

Regla de dependencias (una dirección, sin ciclos):

```
pages (controladores)  →  services (lógica/integraciones) 
                      →  views (render, reciben datos ya resueltos)
services  →  config/auth/drive   (nunca al DOM)
views     →  util/config/theme   (nunca a DriveApi directamente)
```

- **Reloj de datos** (flujo principal): evento → controlador → servicio (validar/llamar Drive) → estado en `services/album.js` → vista re-render.
- **Presentación**: las vistas NO llaman a `DriveApi`; piden datos ya cargados en estado o reciben resultados del controlador.
- **Estado**: vive en `services/album.js` (equivalente al actual `state`), importado por servicios y vistas; sin eventos globales (se mantiene simple).
- **Servicios de dominio** (`invitaciones`, `permisos`, parte de `album`) solo importan `config.js` → testeables con `node --test` sin DOM.

**Componentes reutilizables:** existen y se consolidan: `.btn` (variantes), `.modal` (con `modal.js` para foco), `.toast`, `.chip/.etiqueta`, tarjeta de foto, upload zone, estados vacío/error/skeleton (`galeria.js`), confirm dialog, nav/footer. Solo se añade `nav.js` y `modal.js` (responsabilidad clara); el resto ya existe → evitar crear componentes innecesarios.

**Flujo de datos:**

- Owner: login → `perfil.quienSoy()` → `asegurarEstructura()` → cargar `usuarios`/`invitaciones` → cargar fotos → render.
- Invitado: validar token vía `invitaciones.validar()` (contra `invitaciones.json` + expiración) → si es nuevo, pedir nombre y registrarlo → cargar fotos → render.
- Subida/borrado: controlador → `album.js` actualiza estado → `views` re-render.
- Errores: servicios lanzan errores tipificados → controlador muestra estado de error en pantalla (nunca cerrar sesión salvo `401` real).

**Estrategia de autenticación:**

- Se mantiene OAuth implícito (`initTokenClient`) con scope `drive.file`. Sin cambios de flujo de Google.
- Token en **sessionStorage** (menos exposición que localStorage; se acepta re-login al cerrar pestaña).
- `401` global: limpiar token y mostrar pantalla de login con mensaje ("tu sesión expiró"), recargable sin perder invitación (se conserva query de invitación).
- Errores de red/DOM: NO cierran sesión (`mostrarGateError` deja de hacer `AUTH.salir()`).

**Estrategia de Google Drive:**

- Contrato de `DriveApi` se conserva (no romper datos existentes).
- La grilla usará `thumbnailLink` para las vistas previas (más barato) y blobs solo en lightbox/descarga.
- `compartir()` se revisa: intentar minimizar permisos y, como las invitaciones dependen de archivos compartidos, dejar documentada la limitación (no hay autoridad real sin backend). Medidas: tokens más largos, expiración por defecto opcional, revocación inmediata ya existente.
- Caché de blobs se revoca correctamente (`URL.revokeObjectURL`) y se limita.

**Estrategia de testing (sin framework ni build):**

- **Unit**: `node --test` (motor incluido en Node ≥18, no añade dependencias). Los servicios puros se copian a `.mjs` y se prueban.
- **Verificación ESM**: se conserva el truco actual (`node --check` sobre `.mjs` temporales).
- **Componentes/E2E**: sin Playwright (sería dependencia). Se hace una **matriz de verificación manual** documentada en `plande_trabajo.md` (desktop/tablet/mobile + flujos críticos). En `refactorisacion.md` queda anotado que añadir Playwright quedaría fuera de la restricción del proyecto.

**Ajustes de rutas (MPA, adaptados a este stack):**

```
index.html      →  /         Landing (+ CTAs login/registro)
album.html      →  /album    Galería (único álbum por cuenta, sin sub-rutas)
ajustes.html    →  /ajustes  Configuración (cuenta, privacidad, invitaciones, QR)
privacidad.html →  /privacidad
terminos.html   →  /terminos  (nueva)
404.html        →  cualquier otra ruta (Netlify)
```

No se crean /login ni /register separados: son CTAs de la landing con el mismo flujo OAuth (convención adaptada según §30 de refactorisacion.md).

**Orden de implementación (Fase 3..7, commits por bloque):**

1. Seguridad urgente → 2. Servicios → 3. Accesibilidad/vistas → 4. Galería/rendimiento → 5. Landing legal y SEO → 6. Ajustes/invitaciones/QR → 7. Responsive/mobile → 8. Tests → 9. Docs (README, .gitignore, AGENTS.md).

### Riesgos de ejecución

- Reorganizar archivos rompe imports temporales → se hace por bloques con git y verificación ESM tras cada paso.
- Cambio localStorage→sessionStorage: usuarios que reabran otra pestaña deben re-loguear (aceptado).
- Tocar `structure.js`/permisos puede afectar álbumes existentes → mantener contrato y no reescribir nuevos archivos sobre los ya creados.

---

## Fase 3 — Refactorización por módulos

- [ ] Refactorizar `js/config.js`.
- [ ] Refactorizar `js/util.js`.
- [ ] Refactorizar `js/theme.js`.
- [ ] Refactorizar `js/auth.js`.
- [ ] Refactorizar `js/drive/api.js`.
- [ ] Refactorizar `js/drive/structure.js`.
- [ ] Refactorizar `js/album/state.js`.
- [ ] Refactorizar `js/album/sesion.js`.
- [ ] Refactorizar `js/album/gallery.js`.
- [ ] Refactorizar `js/album/lightbox.js`.
- [ ] Refactorizar `js/album/upload.js`.
- [ ] Refactorizar `js/album/borrar.js`.
- [ ] Refactorizar `js/album/seleccion.js`.
- [ ] Refactorizar `js/album/admin.js`.
- [ ] Refactorizar `js/album/ajustes.js`.
- [ ] Refactorizar `js/album/controller.js`.
- [ ] Refactorizar `js/index.js`.
- [ ] Refactorizar `css/` (sistema de diseño centralizado).
- [ ] Refactorizar páginas HTML (semántica, meta, accesibilidad).
- [ ] Separar lógica de negocio de los componentes visuales.
- [ ] Centralizar estado.
- [ ] Eliminar código duplicado.
- [ ] Verificar sintaxis ESM después de cada bloque.

### Notas de refactorización

(rellenar aquí)

---

## Fase 4 — UI/UX

- [ ] Rediseñar la landing (hero, beneficios, cómo funciona, demo, características, FAQ, footer).
- [ ] Navbar consistente y adaptada al estado de autenticación.
- [ ] Menú responsive en móvil.
- [ ] Mejorar galería (grid, hover, estados).
- [ ] Mejorar álbumes (si aplica).
- [ ] Mejorar página de ajustes (organizada por categorías).
- [ ] Mejorar invitaciones y QR.
- [ ] Estados de carga / error / vacío en cada pantalla importante.
- [ ] Skeleton loaders donde tenga sentido.
- [ ] Lightbox adaptado a móvil.
- [ ] Mejorar experiencia de subida (drag & drop, preview, progreso, validación).
- [ ] Verificar desktop / tablet / mobile (320, 375, 768, 1024, 1440).
- [ ] Sistema de diseño CSS centralizado (colores, tipografía, radius, shadows, spacing).

### Notas de UI/UX

(rellenar aquí)

---

## Fase 5 — Seguridad

- [x] Revisar OAuth (scopes mínimos, manejo de tokens, sin secretos en frontend). → token a `sessionStorage`
- [ ] Revisar Google Drive (mínimo privilegio, no exponer IDs innecesariamente).
- [x] Revisar XSS e inyección (escape de datos no confiables). → `escapeHtml` en búsqueda
- [ ] Revisar URLs manipuladas y validación de inputs.
- [ ] Revisar invitaciones (tokens, expiración, revocación, permisos).
- [ ] Revisar almacenamiento local (solo lo apropiado).
- [ ] Revisar variables de entorno / configuración sensible (`.env.example`).
- [ ] Documentar limitaciones si algo requiere backend para ser seguro.
- [ ] No confiar solo en validaciones del frontend.

### Notas de seguridad

Bloque urgente (2026-09-24, pendiente de commit):
- XSS corregido: `escapeHtml` en `js/util.js`, aplicado al término de búsqueda en `gallery.js`.
- Token OAuth movido de `localStorage` a `sessionStorage` (`js/auth.js`). Cambio de comportamiento aceptado: al cerrar la pestaña hay que re-loguear.
- Errores tipificados: `DriveApi.err()` asigna `code` HTTP; errores de subida XHR también. 401 → "sesión expiró".
- `mostrarGateError` solo limpia la sesión si el error es `401`; fallos de red ya no cierran sesión.
- `cargarJson` ya no traga errores: propaga. Una invitación revocada (404) se traduce a mensaje amistoso en `controller.js`.
- Pendiente siguiente: escapar/purificar el manejo de inputs (más vectores), minimizar permisos de `compartir()`, documentar limitación de autorización sin backend.

---

## Fase 6 — Testing

- [ ] Definir estrategia de pruebas SIN framework (venificación manual + ESM check + script de verificación si aporta valor).
- [ ] Pruebas de utilidades y validaciones.
- [ ] Pruebas de flujos críticos manuales:
  - [ ] Landing → login → galería.
  - [ ] Subida de fotografía.
  - [ ] Borrar fotografía.
  - [ ] Selección múltiple.
  - [ ] Crear invitación.
  - [ ] Generar QR.
  - [ ] Conectar como invitado.
  - [ ] Ajustes.
  - [ ] Logout.
- [ ] Documentar qué se probó y resultado.

### Notas de testing

(rellenar aquí)

---

## Fase 7 — Revisión final

- [ ] Verificación de sintaxis ESM de todos los módulos.
- [ ] Revisión manual en desktop.
- [ ] Revisión manual en tablet.
- [ ] Revisión manual en mobile.
- [ ] Revisar login / logout.
- [ ] Revisar galería / upload / borrado.
- [ ] Revisar invitaciones / QR.
- [ ] Revisar ajustes.
- [ ] Revisar errores (estados de error en cada pantalla).
- [ ] Revisar páginas legales (privacidad/términos).
- [ ] Revisar 404.
- [ ] Actualizar README.
- [ ] Actualizar `AGENTS.md` si la estructura fue refactorizada.
- [ ] Actualizar `refactorisacion.md` si algo del alcance cambió.
- [ ] Commit final y merge.

### Notas de revisión final

(rellenar aquí)

---

## Registro de decisiones

Fecha | Decisión | Motivo

(rellenar aquí)