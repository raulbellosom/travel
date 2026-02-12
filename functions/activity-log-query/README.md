# activity-log-query

Root-only HTTP endpoint for querying `activity_logs`.

## Type

- HTTP endpoint (`POST`, authenticated)

## Payload (optional filters)

```json
{
  "action": "reservation.create_authenticated",
  "entityType": "reservations",
  "actorUserId": "USER_ID",
  "severity": "info",
  "fromDate": "2026-02-01",
  "toDate": "2026-02-12",
  "limit": 50,
  "offset": 0
}
```

## Rules

- Requires authenticated user with `role === root`.
- Supports date range filter (`fromDate` / `toDate`) in `YYYY-MM-DD`.
- Returns paginated records ordered by `$createdAt desc`.
- Logs denied access attempts as `root_panel.access_denied` in `activity_logs`.
