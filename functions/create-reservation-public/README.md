# create-reservation-public

HTTP function that creates a reservation from the web booking flow.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST, authenticated user required)

## Payload

```json
{
  "propertyId": "PROPERTY_ID",
  "checkInDate": "2026-06-10T15:00:00.000Z",
  "checkOutDate": "2026-06-14T11:00:00.000Z",
  "guestCount": 2,
  "guestName": "Optional override",
  "guestPhone": "+5215512345678",
  "feesAmount": 0,
  "taxAmount": 0,
  "specialRequests": "Late check-in"
}
```

`guestEmail` is optional and, if provided, must match the authenticated account email.

## Validation

- User must be authenticated and email-verified.
- Property must exist, be `published`, and `enabled=true`.
- Date range must be valid and available.
- `guestCount` must be between 1 and 500.
- Reservation is created as `status=pending`, `paymentStatus=unpaid`.
- Reservation stores `guestUserId` from auth context.

## Environment

See `.env.example`.
