# property-view-counter

HTTP function that increments `properties.views` for a public property detail view.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST)

## Payload

```json
{
  "propertyId": "PROPERTY_DOCUMENT_ID"
}
```

## Validation

- `propertyId` is required
- Property must exist, be `enabled=true`, and `status=published`

## Environment

See `.env.example`.
