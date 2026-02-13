# activity-log-query

Root-only endpoint to query `activity_logs`.

## Contrato de ejecucion

- Tipo: HTTP Function.
- Trigger Appwrite: invocacion directa de la function `activity-log-query`.
- Metodo: `POST`.
- Permiso `execute`: `users`.
- Scope/rol de actor: requiere usuario autenticado con `users.role = root` y `enabled = true`.

## Scopes minimos de API key

- `databases.read`
- `databases.write`

## Payload (filtros opcionales)

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
