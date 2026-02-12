# issue-reservation-voucher

Issue reservation voucher when reservation is eligible.

## Type

- HTTP endpoint (`POST`)

## Payload

```json
{
  "reservationId": "RESERVATION_ID"
}
```

## Rules

- Reservation must be enabled.
- Reservation status must be `confirmed` or `completed`.
- Payment status must be `paid`.
- Prevents duplicates: returns existing voucher when already created.
