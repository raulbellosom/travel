# payment-webhook-stripe

Stripe webhook handler with idempotency and reservation reconciliation.

## Type

- HTTP endpoint (`POST`)

## Highlights

- Optional Stripe signature validation via `STRIPE_WEBHOOK_SECRET`.
- Idempotency enforced by `providerEventId`.
- Writes `reservation_payments` ledger and updates `reservations.paymentStatus`.
- Triggers `issue-reservation-voucher` when payment is approved.
