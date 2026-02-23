# 18_STRIPE_CONNECT_VALIDATION_RUNBOOK.md

## Objetivo

Este runbook te guia paso a paso para dejar Stripe Connect operativo en esta plataforma y validar que los flujos funcionen de punta a punta:

- leads autenticados + chat
- reservas con hold y expiracion
- checkout con Stripe Connect (destination charge)
- webhook de confirmacion de pago
- delegacion opcional de payouts a usuario interno

Fecha de referencia de este documento: 2026-02-23.

---

## 1) Registro y cuenta base en Stripe

### 1.1 Crear cuenta Stripe (plataforma)

1. Abre: `https://dashboard.stripe.com/register`
2. Completa alta de tu cuenta de negocio (la cuenta plataforma).
3. Entra al Dashboard y verifica que puedes alternar `Test mode` y `Live mode`.

Referencia oficial:
- Stripe accounts: https://docs.stripe.com/get-started/account

### 1.2 Activar Connect

1. En Dashboard, entra a la seccion de Connect (el menu puede variar por version de UI).
2. Completa el setup de plataforma para marketplaces / conectados.
3. Define branding minimo para onboarding de cuentas conectadas.

Referencias oficiales:
- Connect product page: https://stripe.com/connect
- Express accounts: https://docs.stripe.com/connect/express-accounts
- Set up dashboard access: https://docs.stripe.com/connect/marketplace/tasks/dashboard

---

## 2) Claves y secretos Stripe

### 2.1 Obtener API keys

1. Ve a `Developers -> API keys`.
2. Copia:
   - `Publishable key` (test/live)
   - `Secret key` (test/live)
3. Guarda en `.env` de esta app:
   - `STRIPE_PUBLISHABLE_KEY=...`
   - `STRIPE_SECRET_KEY=...`

Referencia oficial:
- API keys: https://docs.stripe.com/keys

### 2.2 Configurar fee de plataforma

Define en `.env`:

- `STRIPE_PLATFORM_FEE_PERCENT=10`
- `STRIPE_PLATFORM_FEE_FIXED=0`

Notas:
- El backend usa estos valores para `application_fee_amount`.
- Se recomienda empezar en test con fee bajo para validar calculo.

---

## 3) Webhook Stripe -> Appwrite

### 3.1 Crear endpoint webhook en Stripe

1. En Stripe Dashboard, crea un webhook endpoint para tu function `payment-webhook-stripe`.
2. Suscribe eventos relevantes (minimo):
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
3. Copia `Webhook signing secret`.

Referencia oficial:
- Webhook signatures: https://docs.stripe.com/webhooks/signatures

### 3.2 Guardar secret en app

En `.env`:

- `STRIPE_WEBHOOK_SECRET=whsec_...`

Importante:
- Secret de test y live son diferentes.
- Si cambias endpoint o haces roll secret, actualiza inmediatamente.

---

## 4) Appwrite: schema obligatorio

Aplica estos cambios en colecciones (segun `docs/03_appwrite_db_schema.md`):

### 4.1 `users`

Agregar atributos:

- `stripeAccountId` (string)
- `stripeOnboardingStatus` (enum: `not_started|pending|complete|restricted`)
- `stripeOnboardingUrl` (string)
- `stripePayoutsEnabled` (boolean, default false)
- `stripePayoutsGrantedByUserId` (string)

### 4.2 `leads`

Modelo autenticado (ya no publico):

- `userId` (required)
- `lastMessage` (required)
- `conversationId` (optional)
- `source` (enum)
- `isArchived` (boolean)
- `metaJson` (string)

### 4.3 `reservations`

Agregar:

- `holdExpiresAt` (datetime)

Indice recomendado:

- `idx_reservations_holdexpires` (`holdExpiresAt` asc)

---

## 5) Appwrite: functions y permisos

Verifica deploy y execute permissions:

1. `create-lead` -> `users`
2. `create-reservation-public` -> `users`
3. `expire-pending-reservations` -> scheduler (`[]` execute)
4. `create-payment-session` -> `users`
5. `payment-webhook-stripe` -> `any`
6. `stripe-create-connected-account` -> `users`
7. `stripe-create-account-link` -> `users`
8. `stripe-refresh-account-link` -> `users`
9. `stripe-get-account-status` -> `users`

Scheduler:

- `expire-pending-reservations` cada 5 minutos.

---

## 6) Variables `.env` que debes revisar

Minimo para esta fase:

- `APPWRITE_FUNCTION_CREATE_LEAD_ID=create-lead`
- `APPWRITE_FUNCTION_EXPIRE_PENDING_RESERVATIONS_ID=expire-pending-reservations`
- `APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID=create-payment-session`
- `APPWRITE_FUNCTION_PAYMENT_WEBHOOK_STRIPE_ID=payment-webhook-stripe`
- `APPWRITE_FUNCTION_STRIPE_CREATE_CONNECTED_ACCOUNT_ID=stripe-create-connected-account`
- `APPWRITE_FUNCTION_STRIPE_CREATE_ACCOUNT_LINK_ID=stripe-create-account-link`
- `APPWRITE_FUNCTION_STRIPE_REFRESH_ACCOUNT_LINK_ID=stripe-refresh-account-link`
- `APPWRITE_FUNCTION_STRIPE_GET_ACCOUNT_STATUS_ID=stripe-get-account-status`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_PUBLISHABLE_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `STRIPE_PLATFORM_FEE_PERCENT=...`
- `STRIPE_PLATFORM_FEE_FIXED=...`

---

## 7) Flujo de onboarding Connect (owner / delegado)

## 7.1 Owner normal

1. Ejecuta `stripe-create-connected-account` para el owner.
2. Ejecuta `stripe-create-account-link`.
3. Abre `onboardingUrl` y completa formulario Stripe.
4. Ejecuta `stripe-get-account-status` hasta ver:
   - `stripeOnboardingStatus=complete`
   - `card_payments=active`
   - `transfers=active`

## 7.2 Delegado interno (nuevo comportamiento)

Si un recurso tiene `ownerUserId` apuntando a un usuario administrativo que recibira pagos:

1. Un owner/root debe activar en ese usuario:
   - `stripePayoutsEnabled=true`
   - `stripePayoutsGrantedByUserId=<owner o root>`
2. Ese usuario ya puede ejecutar sus funciones Stripe Connect self-service.
3. `create-payment-session` permitira Stripe solo si ese `ownerUserId` cumple:
   - owner/root o `stripePayoutsEnabled=true`
   - `stripeAccountId` presente
   - `stripeOnboardingStatus=complete`

---

## 8) QA funcional (paso a paso)

### 8.1 Leads + chat autenticado

1. Sin login: no debe crear lead.
2. Con login (client): click en chat/cotizar debe crear o reusar lead.
3. Reintento de cotizar: no debe duplicar lead abierto para mismo `userId+resourceId`.

Esperado:
- lead en `status=new/contacted`
- `conversationId` asociado
- mensaje inicial creado en `messages`

### 8.2 Reserva con hold

1. Crear reserva para recurso disponible.
2. Verificar:
   - `status=pending`
   - `paymentStatus=unpaid`
   - `holdExpiresAt` con +15 min (o config)
3. Repetir con mismo `clientRequestId`: debe reusar reserva pending.
4. Dejar expirar hold y esperar scheduler: debe pasar a `status=expired`.

### 8.3 Anti double-booking

1. Usuario A crea reserva pending activa en slot/rango.
2. Usuario B intenta solapar mismo rango/slot.
3. Debe responder conflicto (`RESERVATION_CONFLICT`).

### 8.4 Pago Connect

1. Con owner no onboarded -> debe bloquear con error claro.
2. Con owner onboarded completo -> debe crear checkout URL.
3. Completar pago test en Stripe.
4. Webhook debe confirmar:
   - `reservation_payments.status=succeeded`
   - `reservations.paymentStatus=paid`
   - `reservations.status=confirmed`

---

## 9) Prueba webhook local (opcional, recomendada)

Si pruebas localmente, usa Stripe CLI para reenviar eventos al endpoint publico de Appwrite.

Referencia oficial:
- Signatures + testing webhooks: https://docs.stripe.com/webhooks/signatures

Tip:
- Verifica que el endpoint reciba el body raw intacto y responda 2xx rapido.

---

## 10) Checklist de salida a produccion

Antes de live mode:

1. Cambiar a keys live (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`).
2. Crear webhook live y actualizar `STRIPE_WEBHOOK_SECRET` live.
3. Confirmar que todas las cuentas conectadas criticas estan `complete`.
4. Ejecutar una compra real de bajo monto controlada.
5. Validar conciliacion:
   - pago en Stripe
   - documento en `reservation_payments`
   - reserva `confirmed`
6. Configurar monitoreo y alertas de webhook fallidos.

---

## 11) Troubleshooting rapido

- Error `OWNER_PAYOUT_NOT_ENABLED`:
  el `ownerUserId` del recurso no es owner/root ni tiene `stripePayoutsEnabled=true`.

- Error `OWNER_STRIPE_ACCOUNT_REQUIRED`:
  falta `stripeAccountId` en usuario propietario del recurso.

- Error `OWNER_STRIPE_ONBOARDING_INCOMPLETE`:
  onboarding Stripe aun no esta en `complete`.

- Error `RESERVATION_HOLD_EXPIRED`:
  el hold vencio, crear nueva reserva.

---

## 12) Referencias oficiales usadas

- Stripe account setup: https://docs.stripe.com/get-started/account
- API keys: https://docs.stripe.com/keys
- Webhook signatures: https://docs.stripe.com/webhooks/signatures
- Express accounts: https://docs.stripe.com/connect/express-accounts
- Express dashboard integration: https://docs.stripe.com/connect/integrate-express-dashboard
- Set up dashboard access: https://docs.stripe.com/connect/marketplace/tasks/dashboard
- Connect testing: https://docs.stripe.com/connect/testing
- Login links API: https://docs.stripe.com/api/account/create_login_link

