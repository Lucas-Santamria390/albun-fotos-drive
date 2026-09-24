# CONTEXTO Y OBJETIVO DEL PROYECTO

Estoy desarrollando una aplicación web de una galería/álbum de fotografías. Actualmente el código se encuentra desorganizado, con lógica mezclada y estructura tipo "spaghetti code".

Tu objetivo es transformar el proyecto existente en una aplicación **bien estructurada, mantenible, escalable, segura, responsive y con una experiencia UI/UX profesional**, sin perder las funcionalidades que ya existen.

IMPORTANTE: NO quiero que simplemente reescribas todo desde cero sin analizarlo. Primero debes comprender la estructura actual, identificar problemas y luego realizar una refactorización progresiva y justificada.

La aplicación actualmente utiliza:

* Google OAuth para autenticación.
* Google Drive como almacenamiento de las fotografías.
* Cada usuario utiliza su propia cuenta de Google Drive para almacenar sus fotografías.
* La aplicación es principalmente una web de galería de fotografías.
* El proyecto ya contiene código existente que debe ser analizado y mejorado.

---

# 1. PRIMERA FASE: ANALIZAR EL PROYECTO

Antes de modificar código:

1. Analiza toda la estructura actual del proyecto.
2. Identifica:

   * Código duplicado.
   * Código spaghetti.
   * Componentes demasiado grandes.
   * Funciones con demasiadas responsabilidades.
   * Lógica de negocio mezclada con UI.
   * Manejo incorrecto del estado.
   * Dependencias innecesarias.
   * Problemas de naming.
   * Problemas de organización de archivos.
   * Problemas de accesibilidad.
   * Problemas responsive.
   * Problemas de seguridad.
   * Problemas de rendimiento.
   * Problemas de mantenibilidad.
   * Ausencia de pruebas.
3. Identifica qué funcionalidades existentes deben conservarse.
4. Antes de realizar cambios importantes, explica brevemente qué problema estás solucionando y cómo lo solucionarás.

NO elimines funcionalidades existentes simplemente porque parezcan innecesarias.

---

# 2. ARQUITECTURA DEL PROYECTO

Reestructura el proyecto siguiendo principios de arquitectura limpia y modular.

La estructura debe separar claramente:

* UI / presentación.
* Componentes reutilizables.
* Páginas.
* Lógica de negocio.
* Servicios.
* Integraciones externas.
* Autenticación.
* Google Drive.
* Estado de la aplicación.
* Utilidades.
* Validaciones.
* Tipos/interfaces.
* Configuración.
* Tests.

Evita crear una arquitectura excesivamente compleja para una aplicación pequeña.

La arquitectura debe ser:

* Simple.
* Modular.
* Fácil de entender.
* Fácil de probar.
* Fácil de ampliar.
* Fácil de mantener.

Evita el "overengineering".

---

# 3. ESTRUCTURA FUNCIONAL DE LA APLICACIÓN

La aplicación debe tener como mínimo las siguientes áreas:

## Landing Page

Crear una página inicial profesional que explique claramente el producto.

Debe incluir:

* Hero section.
* Explicación breve del producto.
* Beneficios principales.
* Cómo funciona.
* Sección visual de demostración.
* CTA para iniciar sesión.
* CTA para registrarse.
* Sección de características.
* FAQ.
* Footer.

La landing debe transmitir que la aplicación sirve para almacenar, organizar y compartir fotografías mediante álbumes.

No utilizar texto genérico de relleno.

---

# 4. NAVEGACIÓN

Crear una navegación clara y consistente.

La barra de navegación debe adaptarse según el estado de autenticación.

Usuario no autenticado:

* Inicio.
* Iniciar sesión.
* Registrarse.

Usuario autenticado:

* Galería / Álbum.
* Ajustes.
* Perfil.
* Cerrar sesión.

En dispositivos móviles debe existir un menú responsive apropiado.

La navegación debe ser consistente en todas las páginas.

---

# 5. AUTENTICACIÓN

La autenticación debe utilizar exclusivamente Google OAuth, ya que esa es la estrategia definida actualmente para el proyecto.

No crear un sistema adicional de:

* Contraseñas.
* Registro mediante email/password.
* Recuperación de contraseñas propia.

El flujo debe contemplar correctamente:

* Login.
* Registro mediante Google.
* Logout.
* Persistencia de sesión.
* Estado de autenticación.
* Protección de rutas privadas.
* Manejo de sesión expirada.
* Estados de carga.
* Errores de autenticación.

IMPORTANTE:

No solicitar ni almacenar innecesariamente contraseñas de Google.

Utilizar correctamente OAuth y los permisos necesarios.

---

# 6. GOOGLE DRIVE

Google Drive es el almacenamiento de fotografías de cada usuario.

La aplicación debe mantener una separación clara entre:

* Servicio de Google Drive.
* Lógica de negocio.
* Componentes visuales.

Crear una capa/servicio específico para las operaciones de Drive.

Por ejemplo, conceptualmente:

* listar fotografías.
* subir fotografía.
* eliminar fotografía.
* crear álbum/carpeta.
* listar álbumes.
* obtener información de una fotografía.
* generar enlaces cuando corresponda.

No colocar llamadas directamente a Google Drive dentro de componentes visuales.

Utilizar las APIs y permisos mínimos necesarios.

Evitar solicitar permisos excesivos.

---

# 7. GALERÍA / ÁLBUM DE FOTOS

Esta es una de las partes principales de la aplicación.

Crear una interfaz moderna y fácil de utilizar.

Debe permitir:

* Visualizar fotografías.
* Crear/visualizar álbumes.
* Abrir fotografías.
* Navegar entre fotografías.
* Ver fotografías en tamaño grande.
* Eliminar fotografías cuando corresponda.
* Subir fotografías.
* Mostrar estados de carga.
* Mostrar estados vacíos.
* Mostrar errores.
* Confirmar acciones destructivas.

Considerar:

* Grid responsive.
* Lazy loading.
* Optimización de imágenes.
* Lightbox.
* Navegación con teclado.
* Zoom cuando sea apropiado.
* Selección múltiple si resulta útil.
* Drag & drop para subir fotografías.

La galería debe funcionar correctamente en:

* Desktop.
* Tablet.
* Mobile.

---

# 8. EXPERIENCIA UI/UX

La aplicación debe sentirse como un producto real y no como un proyecto académico básico.

Aplicar principios modernos de UX:

* Jerarquía visual clara.
* Espaciado consistente.
* Tipografía legible.
* Estados hover.
* Estados active.
* Estados disabled.
* Feedback después de acciones.
* Mensajes de error claros.
* Confirmaciones.
* Loading states.
* Empty states.
* Skeleton loaders cuando tenga sentido.
* Transiciones sutiles.
* Diseño consistente.

Evitar:

* Exceso de animaciones.
* Colores aleatorios.
* Componentes visualmente inconsistentes.
* Botones sin feedback.
* Modales innecesarios.
* Interfaces saturadas.

La prioridad debe ser:

1. Usabilidad.
2. Claridad.
3. Accesibilidad.
4. Rendimiento.
5. Estética.

---

# 9. DISEÑO RESPONSIVE

Toda la aplicación debe ser completamente responsive.

No diseñar primero únicamente para desktop.

Verificar como mínimo:

* 320px.
* 375px.
* 768px.
* 1024px.
* 1440px.

La interfaz no debe:

* Tener overflow horizontal.
* Romper grids.
* Cortar botones.
* Ocultar información importante.
* Tener textos desbordados.
* Tener modales imposibles de utilizar en móvil.

Los componentes deben adaptarse realmente al tamaño disponible.

---

# 10. PÁGINA DE AJUSTES

Crear una sección dedicada a ajustes.

Debe estar organizada por categorías.

Como mínimo:

### Cuenta

* Información básica de la cuenta.
* Cuenta Google conectada.

### Privacidad

* Información sobre almacenamiento.
* Permisos utilizados.
* Estado de conexión con Google Drive.

### Invitaciones

Permitir gestionar invitaciones a otras personas.

Debe contemplar:

* Crear invitación.
* Ver invitaciones existentes.
* Estado de invitación.
* Revocar invitación.
* Expiración de invitaciones.

### Código QR

Permitir generar un código QR asociado a una invitación o mecanismo de acceso definido por la aplicación.

El QR debe:

* Poder visualizarse.
* Poder descargarse.
* Poder compartirse.
* Tener una opción para regenerarlo/revocarlo cuando corresponda.

No exponer información sensible directamente dentro del QR.

---

# 11. INVITACIONES Y COMPARTIR ÁLBUMES

Diseñar el sistema de invitaciones pensando en seguridad.

Una invitación debería utilizar un token aleatorio y no información predecible.

Considerar:

* Expiración.
* Revocación.
* Permisos.
* Estado.
* Uso único cuando corresponda.
* Protección contra acceso no autorizado.

Diferenciar claramente:

* Propietario del álbum.
* Usuario invitado.
* Permisos del invitado.

No permitir que una persona invitada obtenga automáticamente acceso a todo el Google Drive del propietario.

El acceso debe limitarse estrictamente a los recursos compartidos.

---

# 12. SEGURIDAD

Realizar una revisión de seguridad completa.

Especialmente:

### OAuth

* Utilizar correctamente OAuth.
* Utilizar scopes mínimos.
* No almacenar secretos en frontend.
* No exponer client secrets.
* Manejar correctamente tokens.

### Google Drive

* Aplicar mínimo privilegio.
* Solicitar únicamente los permisos necesarios.
* No exponer IDs o información sensible innecesariamente.

### Frontend

Revisar:

* XSS.
* Inyección.
* URLs manipuladas.
* Datos no confiables.
* Validación de inputs.
* Manejo de errores.

### Invitaciones

Revisar:

* Tokens predecibles.
* Enumeración.
* Expiración.
* Revocación.
* Acceso horizontal no autorizado.

Nunca confiar exclusivamente en validaciones realizadas en frontend.

---

# 13. PÁGINAS LEGALES

La aplicación debe incluir páginas dedicadas a:

* Política de privacidad.
* Términos y condiciones.
* Política de cookies, si aplica.
* Información sobre el uso de Google OAuth.
* Información sobre Google Drive.

Estas páginas deben estar accesibles desde el footer.

IMPORTANTE:

No inventar afirmaciones legales específicas que requieran asesoría jurídica.

Utilizar contenido estructurado y claramente identificable como información del producto, dejando preparados los puntos que posteriormente deban ser revisados legalmente.

---

# 14. FOOTER

Crear un footer profesional presente en las páginas públicas.

Debe incluir:

* Nombre/logo del producto.
* Descripción breve.
* Navegación.
* Ayuda/FAQ.
* Política de privacidad.
* Términos y condiciones.
* Contacto si existe.
* Copyright.

---

# 15. MANEJO DE ERRORES

Crear un sistema consistente para errores.

Contemplar:

* Error de autenticación.
* Error de Google Drive.
* Error de red.
* Archivo demasiado grande.
* Formato no permitido.
* Sesión expirada.
* Permisos insuficientes.
* Álbum inexistente.
* Invitación inválida.
* Invitación expirada.

Los mensajes deben ser comprensibles para usuarios normales.

No mostrar stack traces ni información interna al usuario.

---

# 16. LOADING / EMPTY / ERROR STATES

Cada pantalla importante debe contemplar tres estados:

### Loading

Mostrar feedback visual mientras se cargan datos.

### Empty

Por ejemplo:

"No tienes fotografías todavía."

Con un CTA:

"Subir fotografías"

### Error

Mostrar un mensaje entendible y una opción para intentar nuevamente.

No dejar pantallas completamente blancas cuando una operación falla.

---

# 17. ACCESIBILIDAD

Implementar buenas prácticas de accesibilidad.

Como mínimo:

* HTML semántico.
* Labels correctos.
* Alt text.
* Navegación mediante teclado.
* Focus visible.
* Contraste adecuado.
* Botones accesibles.
* ARIA solamente cuando sea necesario.
* Modales accesibles.
* No depender exclusivamente del color.

Intentar cumplir WCAG 2.2 AA en la medida razonable para el proyecto.

---

# 18. SEO

Para las páginas públicas:

* Title.
* Meta description.
* Open Graph.
* Favicon.
* URLs limpias.
* HTML semántico.

La aplicación privada no necesita un SEO excesivo.

---

# 19. RENDIMIENTO

Optimizar especialmente la galería.

Considerar:

* Lazy loading.
* Carga progresiva.
* Evitar renders innecesarios.
* Caching cuando sea apropiado.
* Paginación o carga incremental.
* Optimización de thumbnails.
* Compresión cuando corresponda.
* Evitar descargar imágenes gigantes innecesariamente.

No sacrificar mantenibilidad por micro-optimizaciones.

---

# 20. LIBRERÍAS

Utiliza librerías gratuitas, open source y ampliamente mantenidas cuando aporten valor real.

Antes de agregar una librería:

1. Verifica que sea necesaria.
2. Evita dependencias duplicadas.
3. Prefiere librerías maduras.
4. Evita paquetes abandonados.
5. Evita paquetes excesivamente grandes para funcionalidades simples.

Dependiendo del stack actual, considera herramientas/librerías como:

* React Router o el router correspondiente al framework.
* Zod para validación.
* Vitest/Jest para pruebas unitarias.
* Testing Library para pruebas de componentes.
* Playwright para pruebas E2E.
* ESLint.
* Prettier.
* TypeScript si el proyecto todavía no lo utiliza y migrarlo es razonable.
* Lucide para iconos.
* Una librería de UI madura si realmente mejora la consistencia del proyecto.
* Una librería de QR mantenida y compatible con el stack actual.

NO agregues todas estas librerías automáticamente.

Primero analiza el stack existente y selecciona únicamente las que tengan sentido.

---

# 21. TESTING

La aplicación debe tener pruebas.

Implementar diferentes niveles:

## Unit Tests

Para:

* Utilidades.
* Validaciones.
* Funciones de transformación.
* Lógica de negocio.

## Component Tests

Para componentes importantes:

* Navbar.
* Login.
* Galería.
* Modal.
* Upload.
* Settings.
* Invitaciones.

## E2E

Utilizar Playwright u otra herramienta apropiada.

Probar flujos críticos como:

1. Usuario entra al landing.
2. Usuario inicia sesión.
3. Usuario accede a la galería.
4. Usuario visualiza álbum.
5. Usuario intenta subir una fotografía.
6. Usuario accede a ajustes.
7. Usuario genera una invitación.
8. Usuario genera un QR.
9. Usuario cierra sesión.

Para Google OAuth y Google Drive, crear mocks/stubs cuando sea necesario para que las pruebas no dependan constantemente de servicios externos reales.

---

# 22. CALIDAD DEL CÓDIGO

Aplicar:

* SOLID cuando sea apropiado.
* DRY.
* KISS.
* Separation of Concerns.
* Single Responsibility Principle.

Pero NO convertir una aplicación sencilla en una arquitectura empresarial innecesariamente complicada.

Prefiero:

Código sencillo y claro

sobre:

Código excesivamente abstracto.

Evitar:

* Funciones gigantes.
* Componentes gigantes.
* Archivos de miles de líneas.
* Variables con nombres ambiguos.
* Lógica duplicada.
* Magic numbers.
* Magic strings.
* Dependencias circulares.

---

# 23. VARIABLES DE ENTORNO

Revisar toda la configuración sensible.

Las credenciales/configuración deben manejarse mediante variables de entorno cuando corresponda.

Nunca colocar:

* Client secrets.
* API keys privadas.
* Tokens.
* Credenciales.

directamente en el código fuente.

Crear/actualizar:

`.env.example`

sin incluir secretos reales.

---

# 24. DOCUMENTACIÓN

Crear o actualizar un README que explique:

* Qué es el proyecto.
* Tecnologías utilizadas.
* Arquitectura.
* Instalación.
* Variables de entorno.
* Configuración de Google OAuth.
* Configuración de Google Drive.
* Cómo ejecutar el proyecto.
* Cómo ejecutar los tests.
* Cómo ejecutar lint.
* Cómo hacer build.
* Estructura de carpetas.

También documentar decisiones arquitectónicas importantes cuando sea necesario.

---

# 25. DISEÑO DE COMPONENTES

Identificar componentes reutilizables.

Por ejemplo:

* Navbar.
* Footer.
* Button.
* Modal.
* Dialog.
* Toast.
* Input.
* Dropdown.
* Avatar.
* Loading.
* Skeleton.
* EmptyState.
* ErrorState.
* PhotoCard.
* PhotoGrid.
* AlbumCard.
* UploadZone.
* ConfirmDialog.

No crear componentes únicamente para reducir el número de líneas.

Un componente debe existir cuando tenga una responsabilidad clara y reutilizable.

---

# 26. EXPERIENCIA DE SUBIDA DE FOTOGRAFÍAS

La subida de imágenes debe ser agradable.

Considerar:

* Drag & drop.
* Selector de archivos.
* Preview.
* Barra de progreso.
* Cancelación.
* Validación de formato.
* Validación de tamaño.
* Manejo de errores.
* Subidas múltiples.
* Feedback cuando termine.

Formatos permitidos deben estar claramente definidos.

---

# 27. GALERÍA EN DISPOSITIVOS MÓVILES

La experiencia móvil debe diseñarse específicamente.

No simplemente reducir el diseño desktop.

Considerar:

* Grid adaptativo.
* Touch gestures cuando aporten valor.
* Lightbox adaptado a móvil.
* Botones suficientemente grandes.
* Menús accesibles.
* Upload desde cámara/galería del teléfono cuando el navegador lo permita.

---

# 28. CONSISTENCIA VISUAL

Definir un pequeño sistema de diseño.

Centralizar:

* Colores.
* Tipografías.
* Border radius.
* Shadows.
* Spacing.
* Breakpoints.
* Tamaños de botones.
* Estados.

Evitar que cada componente tenga valores arbitrarios diferentes.

---

# 29. FLUJOS QUE DEBEN EXISTIR

Verifica que estos flujos sean coherentes:

### Usuario nuevo

Landing → Google Login → autorización → creación/configuración inicial → galería.

### Usuario existente

Landing → Login → galería.

### Subida

Galería → subir → seleccionar fotografías → preview → upload → fotografías visibles.

### Invitación

Ajustes → invitaciones → crear invitación → generar código/QR → compartir.

### Usuario invitado

Abrir invitación → autenticarse con Google si es necesario → validar invitación → acceder únicamente al álbum/recurso compartido.

### Logout

Usuario → cerrar sesión → landing.

---

# 30. PÁGINAS MÍNIMAS

La aplicación debería terminar teniendo como mínimo:

/                 Landing
/login            Inicio de sesión
/register         Registro mediante Google
/gallery           Galería
/albums            Álbumes
/settings          Ajustes
/settings/invites  Invitaciones
/settings/account  Cuenta
/privacy           Política de privacidad
/terms             Términos y condiciones
/404               Página no encontrada

Si el router/framework actual utiliza otra convención, adapta estas rutas.

---

# 31. REGLAS IMPORTANTES PARA LA REFACTORIZACIÓN

NO hagas lo siguiente:

* No reescribas todo sin analizar.
* No cambies tecnologías sin una razón fuerte.
* No agregues dependencias innecesarias.
* No elimines funcionalidades existentes.
* No rompas Google OAuth.
* No rompas Google Drive.
* No expongas credenciales.
* No pongas lógica de negocio dentro de componentes visuales.
* No dupliques código.
* No hagas una arquitectura innecesariamente compleja.
* No ignores mobile.
* No consideres terminada una funcionalidad sin probarla.

---

# 32. PROCESO DE TRABAJO OBLIGATORIO

Trabaja en este orden:

### Fase 1 — Auditoría

Analiza el código existente.

Entrega:

* Problemas encontrados.
* Riesgos.
* Deuda técnica.
* Problemas de arquitectura.
* Problemas UX/UI.
* Problemas de seguridad.
* Problemas de rendimiento.
* Problemas de testing.

NO modifiques todavía las partes críticas.

### Fase 2 — Plan

Propón:

* Nueva estructura de carpetas.
* Arquitectura.
* Componentes.
* Servicios.
* Flujo de datos.
* Estrategia de autenticación.
* Estrategia de Google Drive.
* Estrategia de testing.

### Fase 3 — Refactorización

Implementa los cambios de forma incremental.

Después de cada bloque importante:

* Ejecuta tests.
* Ejecuta lint.
* Ejecuta build.
* Corrige errores.

### Fase 4 — UI/UX

Mejora:

* Landing.
* Navbar.
* Galería.
* Álbumes.
* Ajustes.
* Invitaciones.
* QR.
* Estados de carga/error/vacío.
* Mobile.

### Fase 5 — Seguridad

Revisa nuevamente:

* OAuth.
* Google Drive.
* Tokens.
* Permisos.
* Invitaciones.
* Inputs.
* XSS.
* Variables de entorno.

### Fase 6 — Testing

Implementa y ejecuta:

* Unit tests.
* Component tests.
* E2E.

### Fase 7 — Revisión final

Verifica:

* `lint`
* `test`
* `build`

Y revisa manualmente:

* Desktop.
* Tablet.
* Mobile.
* Login.
* Logout.
* Galería.
* Upload.
* Álbumes.
* Invitaciones.
* QR.
* Ajustes.
* Errores.
* Páginas legales.
* 404.

---

# 33. REGLA PRINCIPAL

No quiero únicamente que el código "funcione".

Quiero que el resultado tenga calidad de un producto web real.

Prioriza:

1. Funcionalidad.
2. Seguridad.
3. Arquitectura.
4. Mantenibilidad.
5. UX/UI.
6. Responsive.
7. Accesibilidad.
8. Rendimiento.
9. Testing.
10. Documentación.

Antes de tomar decisiones importantes, analiza el código existente y utiliza las tecnologías que ya están presentes cuando sean adecuadas.

Si detectas que una decisión actual del proyecto limita seriamente la escalabilidad, explícala antes de reemplazarla.

No inventes funcionalidades que dependan de servicios que el proyecto no utiliza.

Si alguna funcionalidad requiere backend para ser segura, indícalo claramente en lugar de intentar implementarla únicamente en frontend.

El resultado final debe ser un proyecto organizado, profesional, escalable y fácil de continuar desarrollando por otro programador.

---

## RESTRICCIÓN ARQUITECTÓNICA FUNDAMENTAL

Este proyecto NO utilizará backend propio.

La aplicación debe funcionar como una aplicación web estática/client-side.

NO crear:

* Node.js backend.
* Express.
* API REST propia.
* Base de datos propia.
* Servidor de autenticación propio.
* Servidor para almacenar fotografías.

La aplicación utilizará servicios externos directamente desde el cliente cuando sea técnicamente y razonablemente seguro.

### Servicios externos permitidos

La aplicación actualmente utiliza:

1. Google OAuth para autenticación.
2. Google Drive API para almacenamiento de fotografías.

Cada usuario utiliza su propia cuenta de Google y su propio Google Drive.

La aplicación debe diseñarse alrededor de esta arquitectura:

```text
                  ┌─────────────────────┐
                  │      Web App        │
                  │     Frontend        │
                  └──────────┬──────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
             Google OAuth       Google Drive API
                    │                 │
                    └────────┬────────┘
                             ▼
                       Google Account
```

No introducir un backend únicamente para resolver problemas que puedan solucionarse correctamente mediante Google OAuth, Google Drive API o mecanismos propios del navegador.

---

## REGLA PARA INVITACIONES Y COMPARTICIÓN

Debido a que no existe backend propio, NO crear un sistema de invitaciones que dependa de una base de datos propia.

Primero analizar si la funcionalidad puede implementarse utilizando directamente las capacidades de compartición y permisos de Google Drive.

La aplicación debe aprovechar, cuando sea apropiado:

* permisos de Google Drive;
* enlaces de compartición;
* archivos/carpetas compartidos;
* Google OAuth;
* identificadores de recursos de Google Drive.

El frontend no debe intentar convertirse en una autoridad de autorización.

Google debe seguir siendo la autoridad para los permisos sobre los archivos de Drive.

Si una funcionalidad solicitada no puede implementarse de forma segura sin backend, NO crear una solución falsa o insegura.

En ese caso:

1. Explicar la limitación.
2. Proponer una alternativa compatible con una arquitectura 100% frontend.
3. Mantener la aplicación sin backend.

---

## SEGURIDAD EN UNA APLICACIÓN SIN BACKEND

Asumir que todo el código frontend es visible para el usuario.

Por lo tanto:

NUNCA colocar en el código:

* client secrets;
* API secrets;
* private keys;
* credenciales;
* tokens permanentes;
* información que deba mantenerse confidencial.

Las credenciales públicas necesarias para una aplicación frontend deben configurarse según las recomendaciones oficiales del proveedor.

Utilizar OAuth correctamente y solicitar únicamente los permisos necesarios.

No almacenar tokens sensibles de forma insegura.

---

## ALMACENAMIENTO LOCAL

Utilizar `localStorage` o `sessionStorage` únicamente para información que sea apropiada para almacenamiento local.

NO utilizarlos como sustituto de una base de datos.

NO almacenar allí información cuya seguridad dependa de que el usuario no pueda modificarla.

Todo dato almacenado en el navegador debe considerarse manipulable por el usuario.

---

## OBJETIVO

La arquitectura final debe seguir siendo:

Frontend estático
+
Google OAuth
+
Google Drive API
+
APIs/web capabilities necesarias
+
almacenamiento local únicamente cuando corresponda.

No agregar backend.