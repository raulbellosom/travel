# 06_APPWRITE_FUNCTIONS_CATALOG - AUTH MODES + SCOPES

## Referencias

- `02_backend_appwrite_requirements.md`
- `05_permissions_and_roles.md`
- `08_env_reference.md`
- `09_appwrite_platform_limits.md`

---

## 1. Objetivo

Catalogo oficial de functions con contrato de:

- trigger
- auth mode
- execute permission
- role gating
- API key scopes minimos
- module gate
- colecciones afectadas

Regla clave:

- En modo plataforma, `create-lead` y mutaciones de recursos son autenticadas.
- Operaciones de marketing publicas son separadas y no tocan entidades de plataforma.

---

## 2. Auth modes

- `authenticated_session`: requiere usuario autenticado (`execute=users`).
- `api_key_only`: backend/event/cron; no invocacion de usuario final (`execute=[]`).
- `public`: invocable sin login (`execute=any`), uso restringido.

---

## 3. Function scopes and auth matrix

| Function ID | Trigger | Auth mode | Execute | Required roles | Min API key scopes | Module gate | Collections touched |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `user-create-profile` | event `users.*.create` | `api_key_only` | `[]` | n/a | `databases.read`, `databases.write` | no | `users`, `user_preferences` |
| `create-lead` | HTTP POST | `authenticated_session` | `users` | `client` (verified) | `users.read`, `databases.read`, `databases.write` | `module.resources`, `module.leads`, `module.messaging.realtime` | `leads`, `conversations`, `messages`, `activity_logs` |
| `send-lead-notification` | event lead create | `api_key_only` | `[]` | n/a | `databases.read` | no | `leads` |
| `property-view-counter` | HTTP POST | `public` | `any` | n/a | `databases.read`, `databases.write` | optional by instance policy | `resources` |
| `create-reservation-public` | HTTP POST | `authenticated_session` | `users` | `client` (verified) | `users.read`, `databases.read`, `databases.write` | booking/payment modules | `reservations`, `resources`, `activity_logs` |
| `reservation-created-notification` | event reservation create | `api_key_only` | `[]` | n/a | `databases.read`, `databases.write` | no | `reservations` |
| `create-payment-session` | HTTP POST | `authenticated_session` | `users` | reservation guest | `users.read`, `databases.read`, `databases.write` | booking/payment modules | `reservations`, `reservation_payments`, `resources`, `users`, `activity_logs` |
| `payment-webhook-stripe` | HTTP webhook | `public` | `any` | n/a (signature validated) | `databases.read`, `databases.write`, `functions.write` | payment modules | `reservation_payments`, `reservations`, `activity_logs` |
| `expire-pending-reservations` | cron / internal HTTP | `api_key_only` | `[]` | n/a | `databases.read`, `databases.write` | booking modules | `reservations`, `activity_logs` |
| `payment-webhook-mercadopago` | HTTP webhook | `public` | `any` | n/a (signature/verification) | `databases.read`, `databases.write`, `functions.write` | payment modules | `reservation_payments`, `reservations`, `activity_logs` |
| `issue-reservation-voucher` | internal execution | `api_key_only` | `[]` | n/a | `databases.read`, `databases.write` | booking modules | `reservation_vouchers`, `reservations` |
| `create-review-public` | HTTP POST | `authenticated_session` | `users` | `client` (eligible reservation) | `users.read`, `databases.read`, `databases.write` | `module.reviews` | `reviews`, `reservations`, `resources` |
| `moderate-review` | HTTP POST | `authenticated_session` | `users` | `root`/`owner`/scope `reviews.moderate` | `databases.read`, `databases.write` | `module.reviews` | `reviews`, `activity_logs` |
| `staff-user-management` | HTTP POST | `authenticated_session` | `users` | `owner`/`root`/scope `staff.manage` | `users.read`, `users.write`, `databases.read`, `databases.write` | `module.staff` | `users`, `activity_logs` |
| `email-verification` | HTTP POST | `public` | `any` | context dependent (`send/resend/verify`) | `users.read`, `users.write`, `databases.read`, `databases.write` | no | `email_verifications`, `users` |
| `sync-user-profile` | HTTP POST | `authenticated_session` | `users` | self user | `users.read`, `users.write`, `databases.read`, `databases.write` | no | `users` |
| `activity-log-query` | HTTP POST | `authenticated_session` | `users` | `root` only | `databases.read`, `databases.write` | no | `activity_logs` |
| `dashboard-metrics-aggregator` | cron | `api_key_only` | `[]` | n/a | `databases.read`, `databases.write` | `module.analytics.basic` | `analytics_daily`, `reservations`, `leads`, `resources` |
| `root-functions-diagnostics` | HTTP POST | `authenticated_session` | `users` | `root` only | `functions.read`, `databases.read`, `functions.write` (optional smoke) | no | diagnostics only |
| `send-chat-notification` | HTTP POST | `public` | `any` | authenticated caller expected by app flow | `databases.read` | `module.messaging.realtime` | `conversations`, `messages` |
| `send-proposal` | HTTP POST | `authenticated_session` | `users` | `owner`, `root`, `staff_*` + `messaging.write` | `databases.read`, `databases.write` | `module.messaging.realtime` | `conversations`, `messages`, `leads`, `activity_logs` |
| `respond-proposal` | HTTP POST | `authenticated_session` | `users` | `client` participant | `databases.read`, `databases.write` | `module.messaging.realtime` | `conversations`, `messages`, `leads`, `activity_logs` |
| `send-password-reset` | HTTP POST | `public` | `any` | none | `users.read`, `users.write`, `databases.read`, `databases.write` | no | `password_resets`, `users` |
| `stripe-create-connected-account` | HTTP POST | `authenticated_session` | `users` | `owner`/`root` (or delegated payouts) | `users.read`, `databases.read`, `databases.write` | `module.payments.online` | `users`, `activity_logs` |
| `stripe-create-account-link` | HTTP POST | `authenticated_session` | `users` | `owner`/`root` (or delegated payouts) | `users.read`, `databases.read`, `databases.write` | `module.payments.online` | `users`, `activity_logs` |
| `stripe-refresh-account-link` | HTTP POST | `authenticated_session` | `users` | `owner`/`root` (or delegated payouts) | `users.read`, `databases.read`, `databases.write` | `module.payments.online` | `users`, `activity_logs` |
| `stripe-get-account-status` | HTTP POST | `authenticated_session` | `users` | `owner`/`root` (or delegated payouts) | `users.read`, `databases.read`, `databases.write` | `module.payments.online` | `users`, `activity_logs` |
| `create-reservation-manual` | HTTP POST | `authenticated_session` | `users` | internal (`owner/root/staff_*`) + `reservations.write` | `databases.read`, `databases.write` | booking modules | `reservations`, `leads`, `resources`, `activity_logs` |
| `get-resource-availability` | HTTP POST | `public` | `any` | n/a | `databases.read` | `module.resources` | `reservations`, `resources` |
| `create-marketing-contact-public` | HTTP POST | `public` | `any` | n/a | `databases.write` | no | `marketing_contact_requests` |
| `create-newsletter-subscription-publi` | HTTP POST | `public` | `any` | n/a | `databases.read`, `databases.write` | no | `marketing_newsletter_subscribers` |
| `deep-search-query` | HTTP POST | `authenticated_session` | `users` | internal (`root/owner/staff_*`) | `databases.read` | optional by plan | search views |

---

## 4. Mode-specific rules

### Platform mode (`uiMode=platform`)

- Resource lead/chat/reservation/payment/review mutations are allowed only for authenticated and eligible actors.
- `create-lead` source in platform mode should be `authenticated_chat` or `authenticated_form`.

### Marketing mode (`uiMode=marketing`)

- Resource mutation functions should fail with `PLATFORM_MODE_REQUIRED` when applicable.
- Public marketing functions remain available and isolated.

---

## 5. Error contract (shared)

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

## See also

- `../skills/project/05_appwrite_functions_patterns.md`

---

Last update: 2026-03-02
Version: 4.0.0
