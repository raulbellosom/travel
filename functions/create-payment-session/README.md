# create-payment-session

Creates a payment session/preference for an existing reservation.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `create-payment-session`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated user with verified email; must match reservation guest identity.

## Minimum API key scopes

- `users.read`
- `databases.read`
- `databases.write`

## Payload

```json
{
  "reservationId": "RESERVATION_ID",
  "provider": "stripe"
}
```

`guestEmail` is optional and, if provided, must match the authenticated account email.
