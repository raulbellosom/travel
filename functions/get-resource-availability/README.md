# get-resource-availability

Returns public-safe availability snapshots for a published resource.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `get-resource-availability`.
- Method: `POST`.
- `execute` permission: `any` (public-safe response).

## Minimum API key scopes

- `databases.read`

## Payload

```json
{
  "resourceId": "RESOURCE_ID",
  "from": "2026-02-01",
  "to": "2026-12-31"
}
```

## Response

- `blockedDateKeys`: Dates fully blocked (date-range style bookings).
- `occupiedSlotsByDate`: Occupied time intervals for slot/event bookings.
- Includes resource booking context (`bookingType`, `manualContactScheduleType`).
