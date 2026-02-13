# moderate-review

Moderates review records.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `moderate-review`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated user with one of:
  - `role = root`
  - `role = owner`
  - scope `reviews.moderate`

## Minimum API key scopes

- `databases.read`
- `databases.write`

## Payload

```json
{
  "reviewId": "REVIEW_ID",
  "status": "published"
}
```

`status` supports: `published`, `rejected`.
