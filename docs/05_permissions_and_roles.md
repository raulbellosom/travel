# 05_PERMISSIONS_AND_ROLES - INMOBO RESOURCE PLATFORM

## Referencia

- `02_backend_appwrite_requirements.md`
- `03_appwrite_db_schema.md`

---

## 1. Objetivo

Definir acceso por rol + scopes + modulos habilitados para arquitectura v3:

- modelo canonico `resources`
- gating por `instance_settings`
- panel root para plan/modulos/limites

---

## 2. Principios

1. Default deny.
2. Least privilege.
3. Backend-first (frontend no es seguridad).
4. Audit by default en `activity_logs`.
5. Gating por modulos se valida en Functions siempre.

---

## 3. Roles

- `root`: control total tecnico y de producto (modulos, limites, auditoria).
- `owner`: administra operacion de negocio de su instancia.
- `staff_manager`: operacion + gestion parcial.
- `staff_editor`: edicion de catalogo.
- `staff_support`: atencion de leads/reservas/chat.
- `client`: usuario final autenticado.
- `visitor`: solo publico.

---

## 4. Scopes sugeridos

- `resources.read`
- `resources.write`
- `leads.read`
- `leads.write`
- `reservations.read`
- `reservations.write`
- `payments.read`
- `reviews.moderate`
- `staff.manage`
- `root.modules.manage` (solo root)

`users.scopesJson` complementa, pero nunca sustituye reglas de rol.

---

## 5. Reglas por coleccion

### users / user_preferences

- self read/update: `Role.user(self)`.
- staff management: via Function (`owner`/`root`).

### resources / resource_images / rate_plans

- publico: solo `resources.status=published` y `enabled=true`.
- owner/staff autorizado: CRUD por Functions.
- publish/unpublish siempre auditado.

### leads

- create: `create-lead` (auth required, `client` verificado).
- gestion interna: owner/staff con scope.
- canonical id: `resourceId`.

### reservations / reservation_payments / reservation_vouchers

- create reservation: `client` verificado via Function.
- pagos: system-only por functions/webhooks.
- owner/staff: lectura operativa segun scope.
- payouts Stripe: por default solo `owner/root`; se puede delegar a usuario interno con `users.stripePayoutsEnabled=true`.

### conversations / messages

- acceso por participantes del hilo + permisos de coleccion.
- canonical FK: `resourceId` en conversation.

### instance_settings

- lectura: root/owner segun politica de UI.
- escritura: **solo root** (`/app/root/instance`, `/app/root/modules`).
- cada cambio en modulos/limites genera `activity_logs`.

### activity_logs

- write: solo backend/functions.
- read completo: root.

---

## 6. Modulos y gating

Modulos minimos:

- `module.resources`
- `module.leads`
- `module.staff`
- `module.analytics.basic`
- `module.booking.long_term`
- `module.booking.short_term`
- `module.booking.hourly`
- `module.payments.online`
- `module.messaging.realtime`
- `module.reviews`
- `module.calendar.advanced`

Regla:

- Si modulo requerido no esta activo -> 403 `MODULE_DISABLED`.

---

## 7. Matriz resumida

| Modulo/Accion | Root | Owner | Staff Manager | Staff Editor | Staff Support | Client | Visitor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard interno | Yes | Yes | Yes | Yes | Yes | No | No |
| Resources CRUD | Yes | Yes | Yes | Yes | No | No | No |
| Leads gestion | Yes | Yes | Yes | No | Yes | No | No |
| Reservas gestion | Yes | Yes | Yes | No | Yes | No | No |
| Pagos vista | Yes | Yes | Optional | No | No | No | No |
| Chat interno | Yes | Yes | Yes | Optional | Yes | No | No |
| Root modules/limits | Yes | No | No | No | No | No | No |
| Reserva publica | No | No | No | No | No | Yes | No |
| Lead autenticado | No | No | No | No | No | Yes | No |

---

## 8. Guardas frontend (UX)

- `ProtectedRoute`
- `InternalRoute`
- `RoleRoute`
- `ScopeRoute`
- `RootRoute`

Guardas mejoran UX, pero el enforcement final es backend.

---

## 9. Auditoria obligatoria

Eventos criticos:

- cambios de modulos/limites/plan
- create/update/publish de resources
- reservas/pagos
- cambios de rol/scopes
- accesos denegados root

---

Ultima actualizacion: 2026-02-18
Version: 3.0.0
