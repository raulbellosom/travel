# payment-webhook-mercadopago

Mercado Pago webhook handler with idempotency and reservation reconciliation.

## Execution Contract

- Type: HTTP webhook Function.
- Appwrite trigger: public webhook endpoint `payment-webhook-mercadopago`.
- Method: `POST`.
- `execute` permission: `any`.
- Actor scope/role: no user role/scope required; request authenticity validated with signature.

## Minimum API key scopes

- `databases.read`
- `databases.write`
- `functions.write`

## Highlights

- Optional webhook HMAC validation via `MERCADOPAGO_WEBHOOK_SECRET`.
- Idempotency enforced by `providerEventId`.
- Writes `reservation_payments` and updates `reservations.paymentStatus`.
- Triggers `issue-reservation-voucher` when payment is approved.
