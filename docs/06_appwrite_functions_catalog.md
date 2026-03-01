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
7. `functionId` de Appwrite tiene maximo 36 caracteres (puede diferir del nombre visible de la function).

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

## 4.2 `create-lead`

- HTTP POST autenticado (`users` execute).
- Solo actor `client` con correo verificado.
- Canonico: recibe `resourceId` + `message`.
- Valida modulos: `module.resources`, `module.leads`, `module.messaging.realtime`.
- Rechaza la mutacion cuando `instance_settings.uiMode = marketing` (`PLATFORM_MODE_REQUIRED`).
- Upsert de lead abierto por `resourceId + userId` (`status in new/contacted`).
- Crea o reusa conversacion, la reabre a `active` si estaba `archived/closed`, y agrega mensaje inicial.
- Escribe `lead.create` o `lead.update` en `activity_logs`.

Contrato de payload:

```json
{
  "resourceId": "RESOURCE_ID",
  "message": "Hola, me interesa este recurso.",
  "contactChannel": "resource_chat",
  "intent": "visit_request",
  "meta": {
    "booking": {
      "guests": 2,
      "adults": 2,
      "children": 0,
      "pets": 0,
      "startDate": "2026-04-15T00:00:00.000Z",
      "endDate": "2026-04-18T00:00:00.000Z",
      "nights": 3,
      "checkInTime": "15:00",
      "checkOutTime": "11:00"
    },
    "visit": {
      "meetingType": "on_site",
      "preferredSlots": [
        {
          "startDateTime": "2026-04-15T16:00:00.000Z",
          "endDateTime": "2026-04-15T16:30:00.000Z",
          "timezone": "America/Mexico_City"
        }
      ],
      "notes": "Prefiero por la tarde"
    },
    "contactPrefs": {
      "preferredLanguage": "es",
      "phone": "+52 5512345678"
    }
  }
}
```

Reglas de contrato:

- `contactChannel`: `resource_chat | resource_cta_form` (default `resource_chat`).
- `intent`: `booking_request | booking_request_manual | visit_request | info_request`.
- `intent` final se valida/deriva desde `resourceSnapshot`:
  - `sale` y `rent_long_term` => `visit_request`.
  - `rent_short_term + manual_contact` => `booking_request_manual`.
- `metaJson` canonico siempre guarda nodos: `resourceSnapshot`, `booking`, `visit`, `contactPrefs`.
- Limite de `metaJson`: `8000` caracteres.
- Validaciones:
  - `visit_request` exige `visit.preferredSlots` con al menos 1 slot valido.
  - `booking_request_manual` exige `booking.guests` >= 1 y rango valido (`startDate < endDate`).
  - `booking_request` valida rango si se envian fechas.

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
- Implementa anti double-booking con overlap backend y `slotBufferMinutes`.
- Crea hold con `holdExpiresAt` y estado `pending`/`unpaid`.
- Soporta idempotencia por `clientRequestId` (reuso de pending abierta).

## 4.6 `reservation-created-notification`

- Trigger post create reservation.

## 4.7 `create-payment-session`

- HTTP POST autenticado.
- Resuelve `resourceId` desde reserva (`resourceId || propertyId`).
- Valida modulos de booking + pagos online.
- Valida que la reserva siga `pending` y hold no vencido.
- Crea/actualiza `reservation_payments`.
- Stripe Connect: destination charge con `application_fee_amount` y `transfer_data[destination]`.

## 4.8 `payment-webhook-stripe`

- Webhook Stripe.
- Idempotencia por `providerEventId`.
- Marca pagos `succeeded/failed/refunded` y confirma reserva en `succeeded`.

## 4.9 `expire-pending-reservations`

- Scheduled (cada 5 min) o HTTP POST interno.
- Expira reservas `pending + unpaid` con `holdExpiresAt <= now`.
- Registra auditoria en `activity_logs`.

## 4.10 `payment-webhook-mercadopago`

- Webhook Mercado Pago.
- Idempotencia y reconciliacion.

## 4.11 `issue-reservation-voucher`

- Emite voucher cuando pago aprobado.

## 4.12 `create-review-public`

- POST autenticado (`client` verificado, requiere `x-appwrite-user-id`).
- Solo clientes con reservacion completada/confirmada y pagada pueden crear resenas.
- Valida: `resourceId`, `reservationId`, `rating` (1-5), `comment` (min 10 chars), `title` (opcional).
- Verifica que el usuario autenticado sea el huesped de la reservacion.
- Impide duplicados: una resena por reservacion.
- Crea con `status: "pending"`, permisos para autor y dueño del recurso.

## 4.13 `moderate-review`

- Requiere scope `reviews.moderate`.
- Cambia status de resena a `published` o `rejected`.

## 4.14 `staff-user-management`

- CRUD staff controlado por `owner/root`.

## 4.15 `email-verification`

- `send`, `resend`, `verify`.

## 4.16 `sync-user-profile`

- Sincroniza Auth y `users`.

## 4.17 `activity-log-query`

- Root only.

## 4.18 `dashboard-metrics-aggregator`

- Cron diario para `analytics_daily`.

## 4.19 `root-functions-diagnostics`

- Root only, diagnostico operativo.

## 4.20 `send-chat-notification`

- Notificacion email para chat offline.

## 4.21 `send-proposal`

- HTTP POST autenticado (`users` execute).
- Requiere actor interno: `owner`, `root`, `staff_*` con `messaging.write`.
- Valida modulo `module.messaging.realtime`.
- Rechaza en `uiMode=marketing` (`PLATFORM_MODE_REQUIRED`).
- Requiere `conversationId`; `leadId` opcional para vinculo explicito.
- Crea mensaje `messages.kind = proposal` y `payloadJson` estructurado.
- Actualiza `conversations.lastMessage`, `lastMessageAt`, unread counters y fuerza `status=active`.
- Registra `proposal.send` en `activity_logs`.

Contrato de payload:

```json
{
  "conversationId": "CONVERSATION_ID",
  "leadId": "LEAD_ID_OPTIONAL",
  "proposalType": "visit",
  "timeStart": "2026-04-15T16:00:00.000Z",
  "timeEnd": "2026-04-15T16:30:00.000Z",
  "timezone": "America/Mexico_City",
  "meetingType": "on_site",
  "location": "Address or call link",
  "fromResourceAddress": true,
  "expiresAt": "2026-04-14T00:00:00.000Z",
  "body": "Nueva propuesta de visita"
}
```

## 4.22 `respond-proposal`

- HTTP POST autenticado (`users` execute).
- Requiere actor `client` participante de la conversacion.
- Valida modulo `module.messaging.realtime`.
- Rechaza en `uiMode=marketing` (`PLATFORM_MODE_REQUIRED`).
- Requiere: `conversationId`, `proposalMessageId`, `response`.
- Crea mensaje `messages.kind = proposal_response`.
- Actualiza el `payloadJson.status` del mensaje propuesta original:
  - `accept` -> `accepted`
  - `reject` -> `rejected`
  - `request_change` -> `reschedule_requested`
- Actualiza metadata de conversacion (preview, unread, `status=active`).
- Si `response=accept`, actualiza lead abierto a `status=contacted` cuando estaba en `new`.
- Registra `proposal.respond` en `activity_logs`.

Contrato de payload:

```json
{
  "conversationId": "CONVERSATION_ID",
  "proposalMessageId": "MESSAGE_ID",
  "response": "request_change",
  "comment": "Can we move it to tomorrow?",
  "suggestedSlots": [
    {
      "startDateTime": "2026-04-16T16:00:00.000Z",
      "endDateTime": "2026-04-16T16:30:00.000Z",
      "timezone": "America/Mexico_City"
    }
  ]
}
```

## 4.23 `send-password-reset`

- HTTP POST publico (acceso anonimo necesario para el flujo de olvide contrasena).
- Actions: `send` (genera token y envia correo SMTP propio) | `reset` (valida token y actualiza contrasena).
- Reemplaza el sistema nativo `account.createRecovery` / `account.updateRecovery` de Appwrite.
- Guarda tokens en coleccion `password_resets` con TTL configurado (`PASSWORD_RESET_TTL_MINUTES`).
- Cooldown por correo para evitar spam (`PASSWORD_RESET_COOLDOWN_SECONDS`).
- No expone el token en la URL de forma rastreable por Appwrite.
- ENV requeridas: `APPWRITE_COLLECTION_PASSWORD_RESETS_ID`, `APP_BASE_URL`, `APP_NAME`, `EMAIL_SMTP_*`.

## 4.24 `stripe-create-connected-account`

- HTTP POST autenticado (`owner/root`).
- Crea connected account Express y guarda `stripeAccountId` + `stripeOnboardingStatus=pending`.
- Soporta delegacion para usuario interno con `stripePayoutsEnabled=true` (self-service).

## 4.25 `stripe-create-account-link`

- HTTP POST autenticado (`owner/root`).
- Genera account link de onboarding y devuelve URL temporal.
- Soporta delegacion para usuario interno con `stripePayoutsEnabled=true` (self-service).

## 4.26 `stripe-refresh-account-link`

- HTTP POST autenticado (`owner/root`).
- Regenera account link vencido.
- Soporta delegacion para usuario interno con `stripePayoutsEnabled=true` (self-service).

## 4.27 `stripe-get-account-status`

- HTTP POST autenticado (`owner/root`).
- Consulta capabilities/requirements en Stripe y sincroniza `stripeOnboardingStatus`.
- Soporta delegacion para usuario interno con `stripePayoutsEnabled=true` (self-service).

## 4.28 `create-reservation-manual`

- HTTP POST autenticado para operacion interna.
- Crea reservas manuales sin checkout online (`paymentProvider=manual`).
- Soporta conversion de lead a reserva (`leadId`) con preservacion de datos comerciales.

## 4.29 `get-resource-availability`

- HTTP POST para consulta de disponibilidad por `resourceId`.
- Devuelve `blockedDateKeys` y `occupiedSlotsByDate` para calendario de detalle y agenda asistida.
- Considera reservas activas y solapamientos de horario.

## 4.30 `create-marketing-contact-public`

- HTTP POST publico (`any` execute).
- Crea contacto solo en `marketing_contact_requests`.
- No toca `leads`, `conversations` ni `messages`.
- Soporta `utmJson` para analitica y notificacion SMTP opcional a `PLATFORM_OWNER_EMAIL`.
- Payload esperado:
  - `firstName` (string, requerido, max 60)
  - `lastName` (string, requerido, max 60)
  - `email` (email, requerido)
  - `phone` (string, opcional, formato `+52 123 123 1234`)
  - `message` (string, requerido)
  - `source`, `utmJson` (opcionales)
- Si `phone` llega sin formato, la function intenta normalizarlo a `+52 123 123 1234` y valida regex `^\\+52 \\d{3} \\d{3} \\d{4}$`.

## 4.31 `create-newsletter-subscription-public`

- HTTP POST publico (`any` execute).
- Crea/actualiza suscriptor solo en `marketing_newsletter_subscribers`.
- Si el email ya existe, reactiva `enabled=true`.
- No toca `leads`, `conversations` ni `messages`.
- Name en consola: `create-newsletter-subscription-public`.
- Function ID real (ENV/SDK): `create-newsletter-subscription-publi` (ajustado por limite de 36 caracteres).

---

## 5. Execute permissions (resumen)

| Function                     | Execute             |
| ---------------------------- | ------------------- |
| `create-lead`                | `users`             |
| `send-proposal`              | `users`             |
| `respond-proposal`           | `users`             |
| `create-reservation-public`  | `users`             |
| `create-reservation-manual`  | `users`             |
| `get-resource-availability`  | `users`             |
| `expire-pending-reservations`| `[]` (scheduler)    |
| `create-payment-session`     | `users`             |
| `create-review-public`       | `users`             |
| `moderate-review`            | `users`             |
| `staff-user-management`      | `users`             |
| `activity-log-query`         | `users` (root only) |
| `root-functions-diagnostics` | `users` (root only) |
| `stripe-create-connected-account` | `users`       |
| `stripe-create-account-link` | `users`             |
| `stripe-refresh-account-link`| `users`             |
| `stripe-get-account-status`  | `users`             |
| `create-marketing-contact-public` | `any`         |
| `create-newsletter-subscription-publi` | `any`   |
| webhooks                     | `any`               |
| triggers/cron                | `[]`                |

---

## 6. Variables clave (v3)

Nuevas/actualizadas:

- `APPWRITE_COLLECTION_RESOURCES_ID`
- `APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID`
- `APPWRITE_COLLECTION_RATE_PLANS_ID` (si aplica)
- `APPWRITE_COLLECTION_MARKETING_CONTACT_REQUESTS_ID`
- `APPWRITE_COLLECTION_MARKETING_NEWSLETTER_SUBSCRIBERS_ID`
- `APPWRITE_COLLECTION_PASSWORD_RESETS_ID` (send-password-reset)
- `APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID` (frontend)
- `APPWRITE_FUNCTION_CREATE_MANUAL_RESERVATION_ID` (frontend/internal tools)
- `APPWRITE_FUNCTION_GET_RESOURCE_AVAILABILITY_ID` (frontend calendario)
- `APPWRITE_FUNCTION_SEND_PROPOSAL_ID` (frontend/internal chat actions)
- `APPWRITE_FUNCTION_RESPOND_PROPOSAL_ID` (frontend/client chat actions)
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

Ultima actualizacion: 2026-03-01
Version: 3.2.1
