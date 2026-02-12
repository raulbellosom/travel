# moderate-review

HTTP function to moderate review records.

## Type

- HTTP endpoint (`POST`, authenticated)

## Payload

```json
{
  "reviewId": "REVIEW_ID",
  "status": "published"
}
```

`status` supports: `published`, `rejected`.

## Rules

- Requires authenticated internal user (`owner`/`root` or `reviews.moderate` scope).
- Non-root actors can only moderate reviews from their own properties.
- Writes activity audit log when `APPWRITE_COLLECTION_ACTIVITY_LOGS_ID` is configured.
