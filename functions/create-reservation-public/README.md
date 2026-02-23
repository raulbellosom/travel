# create-reservation-public

Creates a reservation from the web booking flow.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `create-reservation-public`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated user with verified email.

## Minimum API key scopes

- `users.read`
- `databases.read`
- `databases.write`

## Payload

```json
{
  "resourceId": "RESOURCE_ID",
  "checkInDate": "2026-06-10T15:00:00.000Z",
  "checkOutDate": "2026-06-14T11:00:00.000Z",
  "startDateTime": "2026-06-10T15:00:00.000Z",
  "endDateTime": "2026-06-10T17:00:00.000Z",
  "guestCount": 2,
  "guestName": "Optional override",
  "guestPhone": "+5215512345678",
  "feesAmount": 0,
  "taxAmount": 0,
  "clientRequestId": "req_abc_123",
  "specialRequests": "Late check-in"
}
```

`guestEmail` is optional and, if provided, must match the authenticated account email.

## Rules

- Rejects resources with `bookingType=manual_contact`; use `create-lead`.
- Validates overlap on backend for `date_range`, `time_slot` and `fixed_event`.
- New reservations are created as `pending` with `holdExpiresAt` (default 15 min, configurable by limits).
- If `clientRequestId` repeats, it returns the existing pending reservation instead of creating a duplicate.

