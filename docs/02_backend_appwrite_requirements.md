# 02_BACKEND_APPWRITE_REQUIREMENTS - REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige por:

- `00_ai_project_context.md`
- `00_project_brief.md`
- `01_frontend_requirements.md`

---

## 1. Principio Arquitectonico

El backend se disena como **single-tenant por instancia**:

- Una instancia Appwrite por cliente.
- Un database principal por cliente (`main`).
- Buckets y Functions propios por cliente.
- Sin shared database entre clientes.

---

## 2. Stack Backend

- Appwrite self-hosted (>= 1.8.x recomendado).
- PostgreSQL como motor de datos.
- Node.js >= 18 para Functions.
- SDK `node-appwrite` >= 17.0.0.

---

## 3. Servicios Appwrite Utilizados

### 3.1 Auth

- Email/password en MVP.
- Verificacion de email obligatoria.
- Recovery de password.
- Sesiones persistentes seguras.

### 3.2 Databases

Colecciones minimas:

- `users`
- `user_preferences`
- `properties`
- `property_images`
- `amenities`
- `leads`
- `reservations`
- `reservation_payments`
- `reservation_vouchers`
- `reviews`
- `analytics_daily`
- `activity_logs`
- `email_verifications`

### 3.3 Storage

Buckets minimos:

- `property-images` (public read)
- `avatars` (private/controlled read)
- `documents` (private)

### 3.4 Functions

- Triggers de auth/database/storage.
- Endpoints HTTP para flujos publicos (lead/reserva/review).
- Webhooks de pago para Stripe/Mercado Pago.

### 3.5 Messaging

- SMTP como base.
- Plantillas para verificacion, reservas, voucher y notificaciones.

### 3.6 Estadisticas y visualizacion

- KPIs diarios materializados en `analytics_daily`.
- Dashboard consume agregados para graficas y cards.
- Actualizacion por Function programada (cron) o evento.

---

## 4. Modelo de Roles y Seguridad

Roles de negocio (campo `users.role`):

- `root` (interno proveedor, oculto)
- `owner` (dueno de instancia cliente)
- `staff_manager`
- `staff_editor`
- `staff_support`
- `client` (usuario final registrado)

Reglas:

- `root` nunca aparece en listados del dashboard normal.
- `owner` puede crear/desactivar staff.
- Staff opera solo en modulos permitidos.
- Ninguna decision de seguridad depende solo del frontend.

---

## 5. Principios de Datos

### 5.1 Estandar comun

Todas las colecciones de negocio deben incluir:

- `createdAt` (datetime)
- `updatedAt` (datetime)
- `enabled` (boolean)

### 5.2 Auditoria obligatoria

Toda accion critica debe registrar entrada en `activity_logs`:

- Actor (`actorUserId`, `actorRole`)
- Entidad (`entityType`, `entityId`)
- Accion (`create`, `update`, `delete`, `status_change`, etc.)
- Snapshot antes/despues (`beforeData`, `afterData`)
- Timestamp

### 5.3 Consistencia funcional

- Estados de reserva y pago deben ser trazables.
- Toda confirmacion de pago depende de webhook validado.
- Emision de voucher solo despues de `paymentStatus=paid`.

---

## 6. Permisos (Backend First)

Primitivas Appwrite usadas:

- `Role.any()`
- `Role.users()`
- `Role.user(userId)`

Notas:

- No se usa modelo multi-tenant por Team para separar clientes.
- El aislamiento entre clientes se resuelve por **instancias separadas**.

Colecciones sensibles (`reservation_payments`, `activity_logs`) son system-only
para lectura/escritura directa y se exponen por Functions controladas.

---

## 7. Reservas y Pagos

### 7.1 Flujo base

1. Cliente autenticado y verificado crea reservacion (`pending`).
2. Se genera intento de pago.
3. Pasarela confirma via webhook.
4. Sistema actualiza pago y reservacion (`confirmed`).
5. Sistema genera voucher.

### 7.2 Integraciones

- Stripe: `payment_intent` + `webhook`.
- Mercado Pago: `preference/payment` + `webhook`.

### 7.3 Reglas no negociables

- Validar firma de webhook.
- Idempotencia por `providerEventId`.
- No confirmar reserva por callback del frontend.

---

## 8. Functions - Estructura Estandar

Cada Function:

- `functions/<name>/.env.example`
- `functions/<name>/README.md`
- `functions/<name>/package.json`
- `functions/<name>/src/index.js`

Politicas:

- Sin secrets hardcodeados.
- Validacion de env requerida al inicio.
- Logs estructurados con `requestId`.

---

## 9. Eventos y Triggers

Eventos minimos recomendados:

- `users.*.create` -> `user-create-profile`
- `databases.*.collections.leads.documents.*.create` -> `send-lead-notification`
- `databases.*.collections.reservations.documents.*.create` -> `reservation-created-notification`
- `databases.*.collections.reservation_payments.documents.*.update` -> `issue-reservation-voucher` (si paid)

---

## 10. Logging y Monitoreo

### 10.1 Logs de ejecucion

- `log()` para eventos funcionales.
- `error()` para fallas.
- Incluir `entityId`, `actorUserId`, `requestId`.

### 10.2 Panel de auditoria root

- Ruta oculta de ActivityLog en frontend.
- Solo `root` puede acceder.
- Debe permitir filtros por fecha, actor, entidad y accion.

---

## 11. Backup y Recuperacion

Minimo por instancia cliente:

- Backup DB diario (retencion 30 dias).
- Backup storage semanal (retencion 60 dias).
- Procedimiento documentado de restore.

---

## 12. Provisioning de Nueva Instancia Cliente

Checklist:

1. Crear proyecto Appwrite dedicado.
2. Crear `database main`.
3. Crear colecciones + indices de `03_appwrite_db_schema.md`.
4. Crear buckets requeridos.
5. Deploy de functions requeridas.
6. Configurar variables de entorno (`08_env_reference.md`).
7. Crear usuario `owner`.
8. Crear usuario `root` interno y marcarlo no listable.
9. Ejecutar smoke test:
   - login
   - alta propiedad
   - lead publico
   - reserva + pago sandbox
   - voucher
   - ActivityLog

---

## 13. Seguridad

- API keys por funcion con scope minimo.
- Rotacion de secrets cada 6 meses.
- Rate limiting en endpoints publicos (`leads`) y autenticados (`reservas/reviews/pagos`).
- Sanitizacion de payloads y validacion estricta.

---

## 14. Relacion con Documentos Posteriores

Este documento habilita:

- `03_appwrite_db_schema.md`
- `05_permissions_and_roles.md`
- `06_appwrite_functions_catalog.md`
- `08_env_reference.md`

---

## 15. Estado del Documento

- Definitivo para arquitectura single-tenant por instancia.
- Preparado para reservas, pagos y auditoria root.
- Sujeto a ampliaciones por cliente sin romper base comun.

---

Ultima actualizacion: 2026-02-11
Version: 2.1.0
