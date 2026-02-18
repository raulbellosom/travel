# property-view-counter

Increments `resources.views` for a public resource detail view.

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
  "resourceId": "RESOURCE_DOCUMENT_ID"
}
```

