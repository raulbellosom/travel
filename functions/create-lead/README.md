# create-lead

Crea o reusa un lead autenticado por `resourceId + userId`, enlaza/reusa la conversacion y registra el primer mensaje.

## Contrato de ejecucion

- Tipo: HTTP Function autenticada.
- Trigger Appwrite: invocacion directa de la function `create-lead`.
- Metodo: `POST`.
- Permiso `execute`: `users`.
- Scope/rol de actor: usuario autenticado.

## Scopes minimos de API key

- `databases.read`
- `databases.write`
- `users.read`

## Payload

```json
{
  "resourceId": "RESOURCE_ID",
  "message": "Me interesa este recurso. Quiero cotizar.",
  "meta": {
    "budget": 25000,
    "preferredDate": "2026-03-10"
  }
}
```

## Output

```json
{
  "ok": true,
  "leadId": "...",
  "conversationId": "..."
}
```
