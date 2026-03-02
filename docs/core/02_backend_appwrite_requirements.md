# 02_BACKEND_APPWRITE_REQUIREMENTS - INMOBO RESOURCE PLATFORM

## Referencia

- `00_ai_project_context.md`
- `00_project_brief.md`
- `01_frontend_requirements.md`

---

## 1. Principio arquitectonico

INMOBO opera como **single-tenant por instancia**:

- 1 proyecto Appwrite por cliente.
- 1 database principal por instancia (`main`).
- Colecciones, buckets y functions aisladas por instancia.
- No existe modelo multi-org dentro de la misma instancia.

---

## 2. Objetivo backend v3

Backend canonico orientado a **resources** + **feature gating por modulos**:

- Entidad comercial principal: `resources`.
- Compatibilidad temporal: `properties` sigue vigente como legado (DEPRECATE).
- Gating de plan: `instance_settings` con `enabledModules` + `limits`.
- Todas las validaciones criticas se ejecutan en Functions.

---

## 3. Servicios Appwrite usados

### 3.1 Auth

- Email/password.
- Verificacion de email obligatoria para reservas/pagos/reviews.

### 3.2 Databases (minimo v3)

Colecciones canonicas:

- `users`
- `user_preferences`
- `resources`
- `resource_images` (o `property_images` en compatibilidad)
- `rate_plans`
- `amenities`
- `leads`
- `reservations`
- `reservation_payments`
- `reservation_vouchers`
- `reviews`
- `conversations`
- `messages`
- `instance_settings`
- `analytics_daily`
- `activity_logs`
- `email_verifications`

Colecciones legacy (deprecate, no eliminar aun):

- `properties`
- `property_images`

### 3.3 Storage

Buckets minimos:

- `property-images` (public read)
- `avatars` (public/controlled segun politica actual)
- `documents` (private)

### 3.4 Functions

- HTTP publicas: leads, reservas, pagos.
- Triggers/eventos: notificaciones, auditoria, agregados.
- Webhooks: Stripe/Mercado Pago.

---

## 4. Sistema de modulos (backend obligatorio)

Fuente de verdad: `instance_settings` (`key = "main"`).

Campos clave:

- `planKey`
- `enabledModules[]`
- `limits` (JSON serializado)
- `enabled`

Modulos base sugeridos:

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

### 4.1 Contrato de bloqueo

Si un modulo esta deshabilitado:

- HTTP `403`
- Payload:

```json
{
  "error": "MODULE_DISABLED",
  "moduleKey": "module.booking.short_term",
  "message": "Este modulo no esta habilitado para esta instancia."
}
```

Si se excede un limite:

```json
{
  "error": "LIMIT_EXCEEDED",
  "limitKey": "maxActiveReservationsPerMonth",
  "message": "Se excedio el limite configurado para el plan."
}
```

---

## 5. Roles y seguridad

Roles en `users.role`:

- `root`
- `owner`
- `staff_manager`
- `staff_editor`
- `staff_support`
- `client`

Reglas:

- Seguridad critica en backend/functions, nunca solo UI.
- `root` controla modulos/plan/limites.
- Owner/staff operan segun scopes y modulos habilitados.

---

## 6. Compatibilidad de migracion

Mientras dure la migracion a resources:

- aceptar `resourceId` y `propertyId` en endpoints criticos.
- guardar `resourceId` como canonico y `propertyId` como alias legacy cuando aplique.
- mantener ruta publica `/propiedades/:slug` cargando desde `resources`.

---

## 7. Auditoria

Toda mutacion relevante debe registrar `activity_logs`:

- cambios en recursos y estados de publicacion
- reservas/pagos
- cambios de plan/modulos/limites
- acciones root

---

## 8. Provisioning de instancia

Checklist minimo:

1. Crear proyecto Appwrite dedicado.
2. Crear DB `main`.
3. Crear colecciones canonicas v3.
4. Mantener colecciones legacy solo para compatibilidad temporal.
5. Deploy functions con helper de modulos/limites.
6. Crear documento `instance_settings` con `key=main`.
7. Ejecutar smoke test: recurso -> lead -> reserva/pago -> chat.

---

Ultima actualizacion: 2026-02-18
Version: 3.0.0
