# create-reservation-public

HTTP function that creates a reservation from a public booking form.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST)

## Payload

```json
{
  "propertyId": "PROPERTY_ID",
  "guestName": "Jane Doe",
  "guestEmail": "jane@example.com",
  "guestPhone": "+5215512345678",
  "checkInDate": "2026-06-10T15:00:00.000Z",
  "checkOutDate": "2026-06-14T11:00:00.000Z",
  "guestCount": 2,
  "feesAmount": 0,
  "taxAmount": 0,
  "specialRequests": "Late check-in"
}
```

## Validation

- Property must exist, be `published`, and `enabled=true`
- Date range must be valid and available
- `guestCount` must be between 1 and 500
- Reservation is created as `status=pending`, `paymentStatus=unpaid`

## Environment

See `.env.example`.
