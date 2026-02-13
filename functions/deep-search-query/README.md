# deep-search-query

Global deep search endpoint for CRM modules using a single function execution.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `deep-search-query`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor: authenticated internal user (`root`, `owner`, `staff_*`).

## Minimum API key scopes

- `databases.read`
- `databases.write` (optional, only if you decide to log search activity later)

## Payload

```json
{
  "query": "raul belloso",
  "limitPerModule": 8
}
```

## Response (shape)

```json
{
  "ok": true,
  "success": true,
  "code": "DEEP_SEARCH_OK",
  "data": {
    "properties": [],
    "leads": [],
    "reservations": [],
    "payments": [],
    "reviews": [],
    "team": [],
    "clients": [],
    "profile": null,
    "preferences": null,
    "loadedAt": 1739462400000
  }
}
```
