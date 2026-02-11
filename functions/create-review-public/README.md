# create-review-public

HTTP function that receives a public review for an eligible reservation.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST)

## Payload

```json
{
  "propertyId": "PROPERTY_ID",
  "reservationId": "RESERVATION_ID",
  "authorName": "Jane Doe",
  "authorEmail": "jane@example.com",
  "rating": 5,
  "title": "Great stay",
  "comment": "Very clean and comfortable"
}
```

## Validation

- Reservation must belong to `propertyId`
- Reservation must be completed/confirmed and paid
- Author email must match reservation guest email
- One review per reservation

## Environment

See `.env.example`.
