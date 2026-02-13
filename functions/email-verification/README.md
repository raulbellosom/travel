# email-verification

HTTP function to send, resend and verify email tokens.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `email-verification`.
- Method: `POST`.
- `execute` permission: `any`.
- Actor scope/role:
  - `send` / `resend`: no role/scope gate in code; validation is by user resolution + cooldown.
  - `verify`: valid non-expired token is required.

## Minimum API key scopes

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`

## Payloads

Send / resend:

```json
{
  "action": "send",
  "userId": "USER_ID",
  "email": "agent@example.com"
}
```

Verify token:

```json
{
  "action": "verify",
  "token": "TOKEN"
}
```
