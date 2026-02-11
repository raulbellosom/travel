# email-verification

Function HTTP para enviar, reenviar y confirmar verificación de correo.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Eventos / ejecución

- Tipo: HTTP endpoint
- Acción en body:
  - `send`
  - `resend`
  - `verify`

## Payloads

Enviar / reenviar:

```json
{
  "action": "send",
  "userAuthId": "USER_ID",
  "email": "agent@example.com"
}
```

Verificar token:

```json
{
  "action": "verify",
  "token": "TOKEN"
}
```

## Variables de entorno

Ver `.env.example`.

## Scopes API Key mínimos

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`
