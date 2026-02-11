# 10_MASTER_PLAN_CHECKLIST - REAL ESTATE SAAS PLATFORM

## Proposito

Checklist maestro para completar el proyecto end-to-end bajo el enfoque SaaS
inmobiliario por instancia dedicada.

Uso:

- Marca cada objetivo completado de `[ ]` a `[x]`.
- No avanzar a fases altas si hay bloqueantes de esquema/seguridad en fases bajas.
- Todo cambio debe seguir `02`, `03`, `05`, `06`, `07` y `08`.

---

## Estado auditado (2026-02-11)

- [x] Documentacion core `docs/00` a `docs/08` existe y esta mayormente alineada al enfoque SaaS.
- [x] Se corrigio `README.md` raiz para eliminar enfoque antiguo de travel marketplace.
- [x] Existen bases de frontend para auth, propiedades, leads e i18n.
- [x] Existen 5 functions en `functions/` (`user-create-profile`, `create-lead-public`, `send-lead-notification`, `email-verification`, `sync-user-profile`).
- [x] Recursos visuales de `resources/` y `refs/` validan lectura correcta (imagenes sanas).
- [x] Validacion sintactica JS de las functions actuales (`node --check`) en verde.
- [ ] Faltan 9 functions MVP definidas en `docs/06_appwrite_functions_catalog.md`.
- [ ] Frontend aun no implementa todas las rutas y modulos definidos en `docs/07_frontend_routes_and_flows.md`.
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

- [ ] Crear matriz de mapeo `codigo actual -> campo canonico schema` por modulo.
- [ ] Corregir `src/services/propertiesService.js` para usar `ownerUserId` y campos definidos en `docs/03`.
- [ ] Corregir `src/services/propertiesService.js` para ordenar por `$createdAt` y no por `createdAt`.
- [ ] Corregir `src/services/propertiesService.js` para `property_images.sortOrder`.
- [ ] Corregir `functions/create-lead-public/src/index.js` para usar `property.ownerUserId`.
- [ ] Eliminar atributos no schema en functions (ej: `source`, `createdAt`, `updatedAt` si no existen en coleccion).
- [ ] Corregir `functions/user-create-profile/src/index.js` para usar rol inicial valido (`owner` bootstrap o flujo definido).
- [ ] Corregir `functions/sync-user-profile/src/index.js` para actualizar solo atributos existentes en `users`.
- [ ] Corregir `functions/email-verification/src/index.js` para no depender de campos fuera de schema `users`.
- [ ] Normalizar permisos de documentos segun `docs/05_permissions_and_roles.md`.

---

## Fase 1 - Variables de entorno y contratos

- [ ] Sincronizar `.env.example` con `docs/08_env_reference.md` (colecciones y functions faltantes).
- [ ] Agregar en `src/env.js` IDs de reservas, pagos, vouchers, reviews, analytics y activity logs.
- [ ] Agregar en `src/env.js` IDs de functions faltantes (reserva, pago, webhook, review, staff, activity).
- [ ] Quitar defaults legacy con subruta `/travel` en variables base de URLs.
- [ ] Validar `getMissingCriticalEnv` para cubrir modulos criticos MVP.
- [ ] Crear tabla de trazabilidad `ENV -> archivo -> modulo`.

---

## Fase 2 - Design system responsive + i18n completo

- [x] Base de componentes atom/molecule/organism existente.
- [ ] Terminar `PropertyCard` 100% segun `docs/04` y referencia `refs/v3.png`.
- [ ] Terminar `PropertyGallery` segun `docs/04` y `refs/details.png`.
- [ ] Estandarizar estados `loading`, `empty`, `error`, `success` por modulo.
- [ ] Validar touch targets >= 44px en componentes interactivos.
- [ ] Implementar checklist A11Y (teclado, focus visible, labels, contraste).
- [ ] Revisar textos hardcoded y mover 100% de UI a `src/i18n/es.json` y `src/i18n/en.json`.
- [ ] Asegurar parity de llaves entre `es.json` y `en.json`.
- [ ] Definir guideline de branding por instancia (colores, tipografias, logo).

---

## Fase 3 - Sitio publico completo

- [x] Rutas base `/, /propiedades/:slug, /login, /register` disponibles.
- [ ] Implementar ruta `/reservar/:slug`.
- [ ] Implementar ruta `/voucher/:code`.
- [ ] Completar formulario de reserva con validacion de fechas, huespedes y monto.
- [ ] Conectar CTA de reserva a function `create-reservation-public`.
- [ ] Conectar flujo de pago a `create-payment-session`.
- [ ] Implementar SEO publico en `/, /propiedades/:slug, /reservar/:slug`.
- [ ] Asegurar no indexacion de rutas privadas y root.

---

## Fase 4 - Dashboard de operacion completo

- [x] Existen pantallas base: dashboard, propiedades, leads, perfil, configuracion.
- [ ] Implementar modulo `/reservas`.
- [ ] Implementar modulo `/pagos`.
- [ ] Implementar modulo `/resenas` (moderacion).
- [ ] Implementar modulo `/equipo` (staff management).
- [ ] Agregar filtros, paginacion y acciones por estado en cada modulo.
- [ ] Renderizar menu sidebar por scopes reales de usuario.
- [ ] Agregar `RoleRoute` y `ScopeRoute` efectivos en rutas privadas.

---

## Fase 5 - Staff management (solo admin interno del cliente)

- [x] Implementar function `staff-user-management` (accion `create_staff`).
- [ ] UI para crear staff con rol (`staff_manager`, `staff_editor`, `staff_support`).
- [ ] UI para asignar y revocar scopes finos (`staff.manage`, `reservations.read`, etc.).
- [ ] UI para desactivar staff (`enabled=false`) sin borrado duro.
- [ ] Bloquear gestion de `root` desde UI owner/staff.
- [ ] Auditar alta/baja/cambio de staff en `activity_logs`.

---

## Fase 6 - Reservas, pagos y vouchers

- [ ] Implementar function `create-reservation-public`.
- [ ] Implementar function `reservation-created-notification`.
- [ ] Implementar function `create-payment-session`.
- [ ] Implementar function `payment-webhook-stripe`.
- [ ] Implementar function `payment-webhook-mercadopago`.
- [ ] Implementar function `issue-reservation-voucher`.
- [ ] Aplicar idempotencia por `providerEventId` en webhooks.
- [ ] Confirmar reserva solo por webhook validado (nunca por callback frontend).
- [ ] Generar y enviar voucher al confirmar pago aprobado.
- [ ] Implementar conciliacion y manejo de estados `approved/rejected/refunded`.

---

## Fase 7 - Formularios de conexion Stripe y Mercado Pago (owner)

- [ ] Crear pantalla de configuracion de pasarelas en `/configuracion`.
- [ ] Formulario Stripe (keys, webhook secret, success/cancel URLs).
- [ ] Formulario Mercado Pago (access token, public key, webhook secret).
- [ ] Guardado seguro de secretos solo en backend/functions.
- [ ] Pruebas sandbox de punta a punta para ambos proveedores.
- [ ] Fallback de proveedor por `PAYMENT_DEFAULT_PROVIDER`.

---

## Fase 8 - Reviews y reputacion

- [ ] Implementar function `create-review-public`.
- [ ] Implementar function `moderate-review`.
- [ ] Permitir resena solo si reserva elegible esta completada.
- [ ] Cola de moderacion en dashboard con estados `pending/published/rejected`.
- [ ] Auditar cambios de estado de resenas en `activity_logs`.

---

## Fase 9 - Panel root y auditoria forense

- [ ] Implementar function `activity-log-query` (root-only).
- [ ] Implementar ruta `VITE_ROOT_PANEL_PATH` (default `/__root/activity`).
- [ ] Crear vista root con filtros por actor, entidad, accion, fecha.
- [ ] Mostrar diff `beforeData` vs `afterData`.
- [ ] Registrar intentos de acceso denegado al panel root.
- [ ] Mantener root oculto en menus y listados de operacion.

---

## Fase 10 - Analytics y dashboard KPI

- [ ] Implementar function `dashboard-metrics-aggregator`.
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

- [ ] Todas las rutas de `docs/07` implementadas y operativas.
- [ ] Todas las functions MVP de `docs/06` implementadas.
- [ ] Flujo reserva + pago + voucher funcionando en sandbox.
- [ ] Owner puede gestionar staff sin exponer root.
- [ ] Auditoria root operativa con `before/after`.
- [ ] Documentacion y `.env.example` sincronizados.

---

Ultima actualizacion: 2026-02-11
Version: 1.0.0
