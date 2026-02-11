# create-payment-session

HTTP function that creates a payment session/preference for a reservation.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST)

## Payload

```json
{
  "reservationId": "RESERVATION_ID",
  "guestEmail": "guest@example.com",
  "provider": "stripe"
}
```

## Behavior

- Validates reservation and guest identity
- Creates or updates `reservation_payments` with `status=pending`
- Syncs reservation `paymentStatus=pending`
- Uses Stripe/Mercado Pago credentials when available
- Returns `mock` checkout URL when provider credentials are not configured

## Environment

See `.env.example`.
