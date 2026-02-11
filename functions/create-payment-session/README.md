# create-payment-session

HTTP function that creates a payment session/preference for a reservation.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST, authenticated user required)

## Payload

```json
{
  "reservationId": "RESERVATION_ID",
  "provider": "stripe"
}
```

`guestEmail` is optional and, if provided, must match the authenticated account email.

## Behavior

- Validates authenticated and email-verified user.
- Validates reservation ownership for that guest (`guestUserId` or legacy email fallback).
- Creates or updates `reservation_payments` with `status=pending`.
- Syncs reservation `paymentStatus=pending`.
- Uses Stripe/Mercado Pago credentials when available.
- Returns `mock` checkout URL when provider credentials are not configured.

## Environment

See `.env.example`.
