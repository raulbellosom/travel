# payment-webhook-stripe

Stripe webhook handler with idempotency and reservation reconciliation.

## Execution Contract

- Type: HTTP webhook Function.
- Appwrite trigger: public webhook endpoint `payment-webhook-stripe`.
- Method: `POST`.
- `execute` permission: `any`.
- Actor scope/role: no user role/scope required; request authenticity validated with Stripe signature.

## Minimum API key scopes

- `databases.read`
- `databases.write`
- `functions.write`

## Highlights

- Optional Stripe signature validation via `STRIPE_WEBHOOK_SECRET`.
- Idempotency enforced by `providerEventId`.
- Writes `reservation_payments` and updates `reservations.paymentStatus`.
- Triggers `issue-reservation-voucher` when payment is approved.
