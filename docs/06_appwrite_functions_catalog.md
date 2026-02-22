# 06_APPWRITE_FUNCTIONS_CATALOG - RESOURCE + MODULE GATING

## Referencia

- `02_backend_appwrite_requirements.md`
- `05_permissions_and_roles.md`
- `08_env_reference.md`

---

## 1. Objetivo

Catalogo oficial de Functions para arquitectura v3:

- `resources` como entidad canonica
- validacion de modulos/limites por instancia
- compatibilidad temporal con `propertyId`

---

## 2. Reglas globales

1. Runtime Node.js >= 18.
2. Validacion estricta de env al inicio.
3. Sin secretos hardcodeados.
4. Logs estructurados con `requestId`.
5. Toda mutacion critica registra `activity_logs`.
6. Gating por modulo/limite en backend (obligatorio).

---

## 3. Helper compartido de modulos

Ubicacion recomendada por function: `src/lib/modulesService.js`.

API minima:

- `loadInstanceSettings()`
- `assertModuleEnabled(moduleKey)`
- `assertLimitNotExceeded(limitKey, currentValue)`
- `toModuleErrorResponse(error)`

Errores estandar:

- `MODULE_DISABLED` (403)
- `LIMIT_EXCEEDED` (403)

---

## 4. Functions activas

## 4.1 `user-create-profile`

- Trigger `users.*.create`.
- Crea `users` + `user_preferences`.
- Rol default: `client`.

## 4.2 `create-lead-public`

- HTTP POST publico.
- Canonico: recibe `resourceId` (acepta `propertyId` como fallback).
- Valida modulo: `module.resources`, `module.leads`.
- Crea lead con `resourceId` + alias legacy `propertyId`.

## 4.3 `send-lead-notification`

- Trigger on lead create.
- Notifica owner/staff responsable.

## 4.4 `property-view-counter`

- HTTP POST.
- Incrementa vistas en entidad de catalogo (compat temporal con properties).

## 4.5 `create-reservation-public`

- HTTP POST autenticado.
- Canonico: `resourceId` (fallback `propertyId`).
- Valida modulo `module.resources`.
- Valida modulo por modo comercial:
  - `rent_short_term` -> `module.booking.short_term`
  - `rent_hourly` -> `module.booking.hourly`
- Si requiere pago online: valida `module.payments.online`.
- Valida limite `maxActiveReservationsPerMonth`.
- Bloquea modos `manual_contact` con respuesta funcional.

## 4.6 `reservation-created-notification`

- Trigger post create reservation.

## 4.7 `create-payment-session`

- HTTP POST autenticado.
- Resuelve `resourceId` desde reserva (`resourceId || propertyId`).
- Valida modulos de booking + pagos online.
- Crea/actualiza `reservation_payments` con `resourceId` + compat legacy.

## 4.8 `payment-webhook-stripe`

- Webhook Stripe.
- Idempotencia por `providerEventId`.

## 4.9 `payment-webhook-mercadopago`

- Webhook Mercado Pago.
- Idempotencia y reconciliacion.

## 4.10 `issue-reservation-voucher`

- Emite voucher cuando pago aprobado.

## 4.11 `create-review-public`

- POST autenticado (`client` verificado).

## 4.12 `moderate-review`

- Requiere scope `reviews.moderate`.

## 4.13 `staff-user-management`

- CRUD staff controlado por `owner/root`.

## 4.14 `email-verification`

- `send`, `resend`, `verify`.

## 4.15 `sync-user-profile`

- Sincroniza Auth y `users`.

## 4.16 `activity-log-query`

- Root only.

## 4.17 `dashboard-metrics-aggregator`

- Cron diario para `analytics_daily`.

## 4.18 `root-functions-diagnostics`

- Root only, diagnostico operativo.

## 4.19 `send-chat-notification`

- Notificacion email para chat offline.

## 4.20 `send-password-reset`

- HTTP POST publico (acceso anonimo necesario para el flujo de olvide contrasena).
- Actions: `send` (genera token y envia correo SMTP propio) | `reset` (valida token y actualiza contrasena).
- Reemplaza el sistema nativo `account.createRecovery` / `account.updateRecovery` de Appwrite.
- Guarda tokens en coleccion `password_resets` con TTL configurado (`PASSWORD_RESET_TTL_MINUTES`).
- Cooldown por correo para evitar spam (`PASSWORD_RESET_COOLDOWN_SECONDS`).
- No expone el token en la URL de forma rastreable por Appwrite.
- ENV requeridas: `APPWRITE_COLLECTION_PASSWORD_RESETS_ID`, `APP_BASE_URL`, `APP_NAME`, `EMAIL_SMTP_*`.

---

## 5. Execute permissions (resumen)

| Function                     | Execute             |
| ---------------------------- | ------------------- |
| `create-lead-public`         | `any`               |
| `create-reservation-public`  | `users`             |
| `create-payment-session`     | `users`             |
| `create-review-public`       | `users`             |
| `moderate-review`            | `users`             |
| `staff-user-management`      | `users`             |
| `activity-log-query`         | `users` (root only) |
| `root-functions-diagnostics` | `users` (root only) |
| webhooks                     | `any`               |
| triggers/cron                | `[]`                |

---

## 6. Variables clave (v3)

Nuevas/actualizadas:

- `APPWRITE_COLLECTION_RESOURCES_ID`
- `APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID`
- `APPWRITE_COLLECTION_RATE_PLANS_ID` (si aplica)
- `APPWRITE_COLLECTION_PASSWORD_RESETS_ID` (send-password-reset)
- `APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID` (frontend)
- `PASSWORD_RESET_TTL_MINUTES` / `PASSWORD_RESET_COOLDOWN_SECONDS`

Nota:

- `APPWRITE_COLLECTION_RESOURCES_ID` es obligatorio para todas las functions de catalogo.

---

## 7. Contrato de error estandar

```json
{
  "success": false,
  "error": "MODULE_DISABLED",
  "moduleKey": "module.booking.short_term",
  "message": "Este modulo no esta habilitado para esta instancia."
}
```

```json
{
  "success": false,
  "error": "LIMIT_EXCEEDED",
  "limitKey": "maxActiveReservationsPerMonth",
  "message": "Se excedio el limite configurado para el plan."
}
```

---

Ultima actualizacion: 2026-02-22
Version: 3.1.0
