# create-review-public

HTTP function that receives a review for an eligible reservation.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST, authenticated user required)

## Payload

```json
{
  "propertyId": "PROPERTY_ID",
  "reservationId": "RESERVATION_ID",
  "rating": 5,
  "title": "Great stay",
  "comment": "Very clean and comfortable"
}
```

## Validation

- User must be authenticated and email-verified.
- Reservation must belong to `propertyId`.
- Reservation must be completed/confirmed and paid.
- Authenticated user must match reservation guest (`guestUserId` or legacy email fallback).
- One review per reservation.
- Review stores `authorUserId` from auth context.

## Environment

See `.env.example`.
