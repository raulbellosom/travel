# property-view-counter

Increments `properties.views` for a public property detail view.

## Execution Contract

- Type: HTTP Function publica.
- Appwrite trigger: invocacion directa de la function `property-view-counter`.
- Method: `POST`.
- `execute` permission: `any`.
- Scope/rol de actor: no requiere usuario autenticado.

## Scopes minimos de API key

- `databases.read`
- `databases.write`

## Payload

```json
{
  "propertyId": "PROPERTY_DOCUMENT_ID"
}
```
