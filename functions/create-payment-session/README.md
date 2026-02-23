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

## Rules

- Reservation must be `pending` and hold must be active.
- Stripe provider requires owner onboarding (`stripeAccountId` + `stripeOnboardingStatus=complete`).
- Stripe payouts are allowed for `owner/root` or delegated internal users (`stripePayoutsEnabled=true`).
- Stripe session uses destination charge with platform fee (`application_fee_amount`).

