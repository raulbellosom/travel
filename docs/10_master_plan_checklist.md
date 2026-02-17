# 10_MASTER_PLAN_CHECKLIST - REAL ESTATE SAAS PLATFORM

## Proposito

Checklist maestro para completar el proyecto end-to-end bajo el enfoque SaaS
inmobiliario por instancia dedicada.

Uso:

- Marca cada objetivo completado de `[ ]` a `[x]`.
- No avanzar a fases altas si hay bloqueantes de esquema/seguridad en fases bajas.
- Todo cambio debe seguir `02`, `03`, `05`, `06`, `07` y `08`.

---

## Estado auditado (2026-02-12)

- [x] Documentacion core `docs/00` a `docs/08` existe y esta mayormente alineada al enfoque SaaS.
- [x] Se corrigio `README.md` raiz para eliminar enfoque antiguo de travel marketplace.
- [x] Existen bases de frontend para auth, propiedades, leads e i18n.
- [x] Catalogo MVP de functions cubierto en `functions/` (incluye webhooks, moderate review, activity-log-query y voucher issuance).
- [x] Recursos visuales de `resources/` y `refs/` validan lectura correcta (imagenes sanas).
- [x] Validacion sintactica JS de las functions actuales (`node --check`) en verde.
- [x] Functions MVP de `docs/06_appwrite_functions_catalog.md` implementadas en el repo.
- [x] Frontend implementa rutas publicas y modulos operativos base definidos en `docs/07_frontend_routes_and_flows.md`.
- [x] Matriz de mapeo de schema y trazabilidad ENV creada (`docs/11` y `docs/12`).
- [x] Staff management completo (alta/listado/update/scopes/enable-disable) con auditoria.
- [x] App shell del dashboard reforzado para responsive (desktop + mobile) con sidebar colapsable y drawer tactil.
- [x] Empty states visuales reutilizables y animados aplicados en modulos clave sin registros.
- [x] Cambio de idioma optimizado para evitar refetch innecesario en loaders del panel.
- [x] Barra inferior del sidebar y footer `/app` unificadas en altura para continuidad visual.
- [ ] Hay desalineaciones criticas entre schema `docs/03` y campos usados en frontend/functions.

---

## Contrato canonico de base de datos (usar estos valores)

Reglas bloqueantes:

- `properties.ownerUserId` (no `userId`).
- `property_images.sortOrder` (no `order`).
- Indices temporales y listados por `$createdAt`/`$updatedAt` (no `createdAt` custom).
- Evitar atributos no declarados en `docs/03_appwrite_db_schema.md`.

Enums canonicos:

- `users.role`: `root`, `owner`, `staff_manager`, `staff_editor`, `staff_support`, `client`.
- `user_preferences.theme`: `light`, `dark`, `system`.
- `user_preferences.locale`: `es`, `en`.
- `properties.propertyType`: `house`, `apartment`, `land`, `commercial`, `office`, `warehouse`.
- `properties.operationType`: `sale`, `rent`, `vacation_rental`.
- `properties.status`: `draft`, `published`, `inactive`, `archived`.
- `properties.currency`: `MXN`, `USD`, `EUR`.
- `amenities.category`: `general`, `security`, `outdoor`, `services`, `tech`.
- `leads.status`: `new`, `contacted`, `closed_won`, `closed_lost`.
- `reservations.status`: `pending`, `confirmed`, `cancelled`, `completed`, `expired`.
- `reservations.paymentStatus`: `unpaid`, `pending`, `paid`, `failed`, `refunded`.
- `reservations.paymentProvider`: `stripe`, `mercadopago`, `manual`.
- `reservation_payments.provider`: `stripe`, `mercadopago`.
- `reservation_payments.status`: `pending`, `approved`, `rejected`, `refunded`.
- `reviews.status`: `pending`, `published`, `rejected`.
- `activity_logs.severity`: `info`, `warning`, `critical`.

---

## Fase 0 - Cierre de bloqueantes (obligatoria)

- [x] Crear matriz de mapeo `codigo actual -> campo canonico schema` por modulo.
- [x] Corregir `src/services/propertiesService.js` para usar `ownerUserId` y campos definidos en `docs/03`.
- [x] Corregir `src/services/propertiesService.js` para ordenar por `$createdAt` y no por `createdAt`.
- [x] Corregir `src/services/propertiesService.js` para `property_images.sortOrder`.
- [x] Corregir `functions/create-lead-public/src/index.js` para usar `property.ownerUserId`.
- [ ] Eliminar atributos no schema en functions (ej: `source`, `createdAt`, `updatedAt` si no existen en coleccion).
- [x] Corregir `functions/user-create-profile/src/index.js` para usar rol inicial valido (`owner` bootstrap o flujo definido).
- [x] Corregir `functions/sync-user-profile/src/index.js` para actualizar solo atributos existentes en `users`.
- [x] Corregir `functions/email-verification/src/index.js` para no depender de campos fuera de schema `users`.
- [ ] Normalizar permisos de documentos segun `docs/05_permissions_and_roles.md`.
- [ ] Desacoplar listados internos de filtros por `ownerUserId/propertyOwnerId` para operar catalogo compartido por instancia con control por rol/scope.

---

## Fase 1 - Variables de entorno y contratos

- [x] Sincronizar `.env.example` con `docs/08_env_reference.md` (colecciones y functions faltantes).
- [x] Agregar en `src/env.js` IDs de reservas, pagos, vouchers, reviews, analytics y activity logs.
- [x] Agregar en `src/env.js` IDs de functions faltantes (reserva, pago, webhook, review, staff, activity).
- [ ] Quitar defaults legacy con subruta `/travel` en variables base de URLs.
- [x] Validar `getMissingCriticalEnv` para cubrir modulos criticos MVP.
- [x] Crear tabla de trazabilidad `ENV -> archivo -> modulo`.

---

## Fase 2 - Design system responsive + i18n completo

- [x] Base de componentes atom/molecule/organism existente.
- [x] App shell responsive de dashboard con sidebar colapsable, layout estable y gestos tactiles base.
- [x] Sidebar colapsable sin salto de iconos/logo, con labels en fade y tooltip en modo colapsado.
- [x] Toggle de tema (light/dark) visible en navbar del panel administrativo.
- [x] Navbar del panel con selector de idioma `es/en` y footer `/app` en variante compacta.
- [x] Footer `/app` alineado al shell (barra compacta) y copyright con iconografia.
- [x] Estados vacios del panel estandarizados con componente `EmptyStatePanel` (responsive + motion).
- [ ] Terminar `PropertyCard` 100% segun `docs/04` y referencia `refs/v3.png`.
- [ ] Terminar `PropertyGallery` segun `docs/04` y `refs/details.png`.
- [ ] Estandarizar estados `loading`, `empty`, `error`, `success` por modulo.
- [ ] Validar touch targets >= 44px en componentes interactivos.
- [ ] Implementar checklist A11Y (teclado, focus visible, labels, contraste).
- [ ] Revisar textos hardcoded y mover 100% de UI a `src/i18n/es.json` y `src/i18n/en.json`.
- [x] Definir guideline de copy user-facing: no exponer roles/terminos internos en UI no-root.
- [ ] Asegurar parity de llaves entre `es.json` y `en.json`.
- [ ] Definir guideline de branding por instancia (colores, tipografias, logo).

---

## Fase 3 - Sitio publico completo

- [x] Rutas base `/, /propiedades/:slug, /login, /register` disponibles.
- [x] Implementar ruta `/reservar/:slug`.
- [x] Implementar ruta `/voucher/:code`.
- [x] Completar formulario de reserva con validacion de fechas, huespedes y monto.
- [x] Conectar CTA de reserva a function `create-reservation-public`.
- [x] Conectar flujo de pago a `create-payment-session`.
- [x] Implementar SEO publico en `/, /propiedades/:slug, /reservar/:slug`.
- [x] Asegurar no indexacion de rutas privadas y root.

---

## Fase 4 - Dashboard de operacion completo

- [x] Existen pantallas base: dashboard, propiedades, leads, perfil, configuracion.
- [x] Implementar modulo `/app/reservations`.
- [x] Implementar modulo `/app/calendar` (agenda con vistas dia/semana/mes/año).
- [x] Implementar modulo `/app/payments`.
- [x] Implementar modulo `/app/reviews` (moderacion).
- [x] Implementar modulo `/app/team` (staff management).
- [ ] Agregar filtros, paginacion y acciones por estado en cada modulo.
- [x] Renderizar menu sidebar por scopes reales de usuario.
- [x] Agregar `RoleRoute` y `ScopeRoute` efectivos en rutas privadas.
- [x] Separar perfil interno (`/app/profile`) del perfil cliente (`/perfil`) con restriccion bidireccional.

---

## Fase 4.1 - Calendario y disponibilidad

- [x] Implementar calendario administrativo con vistas de dia, semana, mes y año.
- [x] Implementar filtros de calendario por propiedad, estado y estado de pago.
- [x] Implementar modal de detalle de reservacion desde calendario.
- [x] Implementar calendario publico de disponibilidad con precios por noche.
- [x] Implementar resumen de reserva con desglose de precio.
- [ ] Integrar calendario de disponibilidad en pagina de detalle de propiedad (`vacation_rental`).
- [ ] Conectar resumen de reserva con flujo de pago existente.

---

## Fase 5 - Staff management (solo admin interno del cliente)

- [x] Implementar function `staff-user-management` (accion `create_staff`).
- [x] UI para crear staff con rol (`staff_manager`, `staff_editor`, `staff_support`).
- [x] UI para asignar y revocar scopes finos (`staff.manage`, `reservations.read`, etc.).
- [x] UI para desactivar staff (`enabled=false`) sin borrado duro.
- [x] Bloquear gestion de `root` desde UI owner/staff.
- [x] Auditar alta/baja/cambio de staff en `activity_logs`.

---

## Fase 6 - Reservas, pagos y vouchers

- [x] Implementar function `create-reservation-public`.
- [x] Implementar function `reservation-created-notification`.
- [x] Implementar function `create-payment-session`.
- [x] Implementar function `payment-webhook-stripe`.
- [x] Implementar function `payment-webhook-mercadopago`.
- [x] Implementar function `issue-reservation-voucher`.
- [x] Aplicar idempotencia por `providerEventId` en webhooks.
- [x] Confirmar reserva solo por webhook validado (nunca por callback frontend).
- [ ] Generar y enviar voucher al confirmar pago aprobado.
- [x] Implementar conciliacion y manejo de estados `approved/rejected/refunded`.

---

## Fase 7 - Formularios de conexion Stripe y Mercado Pago (owner)

- [ ] Crear pantalla de configuracion de pasarelas en `/app/settings`.
- [ ] Formulario Stripe (keys, webhook secret, success/cancel URLs).
- [ ] Formulario Mercado Pago (access token, public key, webhook secret).
- [ ] Guardado seguro de secretos solo en backend/functions.
- [ ] Pruebas sandbox de punta a punta para ambos proveedores.
- [ ] Fallback de proveedor por `PAYMENT_DEFAULT_PROVIDER`.

---

## Fase 8 - Reviews y reputacion

- [x] Implementar function `create-review-public`.
- [x] Implementar function `moderate-review`.
- [x] Permitir reseña solo si reserva elegible esta completada.
- [x] Cola de moderacion en dashboard con estados `pending/published/rejected`.
- [x] Auditar cambios de estado de reseñas en `activity_logs`.

---

## Fase 9 - Panel root y auditoria forense

- [x] Implementar function `activity-log-query` (root-only).
- [x] Implementar rutas root internas del dashboard (`/app/activity` y `/app/amenities`).
- [x] Crear vista root con filtros por actor, entidad, accion, fecha.
- [x] Mostrar diff `beforeData` vs `afterData`.
- [x] Registrar intentos de acceso denegado al panel root.
- [x] Mantener root oculto en menus y listados de operacion.

---

## Fase 10 - Analytics y dashboard KPI

- [x] Implementar function `dashboard-metrics-aggregator`.
- [ ] Escribir agregados diarios en `analytics_daily`.
- [ ] Graficar leads, reservas, pagos aprobados e ingresos por periodo.
- [ ] Definir zona horaria de corte diario por instancia cliente.

---

## Fase 11 - QA, testing y hardening

- [ ] Crear smoke test funcional: auth, propiedad, lead, reserva, pago, voucher, activity.
- [ ] Crear pruebas de permisos por rol y por scope.
- [ ] Crear pruebas de webhooks idempotentes.
- [ ] Resolver errores ESLint existentes o excluir paths de referencia (`functions/`, `refs/`) del lint frontend.
- [ ] Agregar pruebas E2E de rutas criticas (publicas + privadas + root).
- [ ] Revisar bundle y aplicar code splitting por rutas pesadas.

---

## Fase 12 - Provisioning por cliente y operacion SaaS

- [ ] Documentar runbook reproducible de alta de instancia cliente.
- [ ] Script checklist para crear proyecto Appwrite + database + collections + buckets + functions.
- [ ] Crear owner bootstrap y root interno por instancia.
- [ ] Definir plantilla de branding y dominio por cliente.
- [ ] Definir checklist de handoff y soporte post go-live.

---

## Validacion continua de refs y resources

- [x] `resources/` y `refs/` tienen assets validos y legibles.
- [ ] Usar `resources/*.png` como baseline visual en QA responsive.
- [ ] Tratar `refs/*` como referencia historica, no como contrato de schema actual.
- [ ] Mantener sincronia de examples en `refs/` cuando cambie el contrato real.

---

## Criterio de cierre MVP

- [x] Todas las rutas de `docs/07` implementadas y operativas.
- [x] Todas las functions MVP de `docs/06` implementadas.
- [ ] Flujo reserva + pago + voucher funcionando en sandbox.
- [x] Owner puede gestionar staff sin exponer root.
- [x] Auditoria root operativa con `before/after`.
- [x] Documentacion y `.env.example` sincronizados.
- [x] Chat schema documentado (`docs/03`, `docs/13`) y variables en `.env.example`.
- [x] Calendario implementado y documentado en `docs/07`.

---

Ultima actualizacion: 2026-02-16
Version: 1.3.0
