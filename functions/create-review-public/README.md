# create-review-public

Receives a review for an eligible reservation.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `create-review-public`.
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
  "propertyId": "PROPERTY_ID",
  "reservationId": "RESERVATION_ID",
  "rating": 5,
  "title": "Great stay",
  "comment": "Very clean and comfortable"
}
```
