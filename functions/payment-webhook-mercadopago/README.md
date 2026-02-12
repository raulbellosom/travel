# payment-webhook-mercadopago

Mercado Pago webhook handler with idempotency and reservation reconciliation.

## Type

- HTTP endpoint (`POST`)

## Highlights

- Optional webhook HMAC validation via `MERCADOPAGO_WEBHOOK_SECRET`.
- Idempotency enforced by `providerEventId`.
- Writes `reservation_payments` ledger and updates `reservations.paymentStatus`.
- Triggers `issue-reservation-voucher` when payment is approved.
