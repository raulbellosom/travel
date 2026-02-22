# send-password-reset

HTTP function that handles the complete **custom SMTP password reset flow**, replacing
Appwrite's native `account.createRecovery` / `account.updateRecovery` to allow branded
emails sent through the project's own SMTP service.

Two actions are exposed via a single endpoint:

- **`send`** — resolves the user by email, enforces a cooldown, invalidates previous
  tokens, generates a new token, persists it in the `password_resets` collection, and
  sends the reset link via SMTP.
- **`reset`** — validates the token (not used, not invalidated, not expired), updates
  the user password through the server-side Users API, and marks the token as used.

The `send` action always returns HTTP 200 regardless of whether the email exists
(silent 200 pattern to prevent user enumeration).

---

## Execution Contract

- Type: HTTP Function.
- Method: POST (both actions).
- `execute` permission: `any` (anonymous access required — user is not authenticated
  during forgot-password flow).
- Actor scope/role: none required.

---

## Minimum API key scopes

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`

---

## Payloads

### Action: `send`

Accepts either `email` or `userId` to identify the user.

```json
{
  "action": "send",
  "email": "user@example.com"
}
```

```json
{
  "action": "send",
  "userId": "USER_ID"
}
```

### Action: `reset`

```json
{
  "action": "reset",
  "token": "TOKEN_FROM_EMAIL_LINK",
  "password": "newSecurePassword123"
}
```

The `action` can also be passed as a query parameter: `?action=send`.

---

## Output

### `send` — success (user exists or not)

```json
{ "ok": true, "message": "Si el correo existe recibirás un enlace." }
```

### `send` — cooldown active

```json
{
  "ok": false,
  "code": "COOLDOWN",
  "message": "Espera 42 segundos antes de solicitar otro enlace.",
  "retryAfterSeconds": 42,
  "nextAllowedAt": "2026-02-22T18:00:00.000Z"
}
```

### `reset` — success

```json
{
  "ok": true,
  "code": "PASSWORD_RESET",
  "message": "Contraseña actualizada correctamente."
}
```

### `reset` — error responses

| HTTP | `code`             | Causa                                           |
| ---- | ------------------ | ----------------------------------------------- |
| 400  | `MISSING_TOKEN`    | Cuerpo sin campo `token`                        |
| 400  | `INVALID_PASSWORD` | `password` menor a 8 caracteres                 |
| 400  | `INVALID_TOKEN`    | Token no encontrado, ya usado, o invalidado     |
| 400  | `TOKEN_EXPIRED`    | Token expirado (TTL superado)                   |
| 400  | `INVALID_ACTION`   | `action` distinto de `send` / `reset`           |
| 500  | `MISSING_CONFIG`   | Faltan credenciales de Appwrite en las ENV vars |
| 500  | `INTERNAL_ERROR`   | Error inesperado (ver logs de la funcion)       |

---

## Reset link format

The email contains a link with the form:

```
{APP_BASE_URL}/reset-password?token=TOKEN
```

The frontend reads `?token=` from the URL and calls this function's `reset` action.

---

## Environment Variables

| Variable                                 | Required | Default                 | Description                                    |
| ---------------------------------------- | -------- | ----------------------- | ---------------------------------------------- |
| `APPWRITE_FUNCTION_ENDPOINT`             | yes      | —                       | Appwrite endpoint (server-side)                |
| `APPWRITE_FUNCTION_PROJECT_ID`           | yes      | —                       | Appwrite project ID                            |
| `APPWRITE_FUNCTION_API_KEY`              | yes      | —                       | Appwrite API key with users + databases scopes |
| `APPWRITE_DATABASE_ID`                   | yes      | `mainv2`                | Database ID                                    |
| `APPWRITE_COLLECTION_PASSWORD_RESETS_ID` | yes      | `password_resets`       | Collection ID for reset tokens                 |
| `APP_BASE_URL`                           | yes      | `http://localhost:5173` | Base URL for the reset link in the email       |
| `APP_NAME`                               | no       | `Inmobo`                | App name shown in the email subject/body       |
| `PASSWORD_RESET_TTL_MINUTES`             | no       | `60`                    | Token expiry in minutes                        |
| `PASSWORD_RESET_COOLDOWN_SECONDS`        | no       | `60`                    | Min seconds between consecutive send requests  |
| `EMAIL_SMTP_HOST`                        | yes      | —                       | SMTP host                                      |
| `EMAIL_SMTP_PORT`                        | no       | `587`                   | SMTP port                                      |
| `EMAIL_SMTP_SECURE`                      | no       | `false`                 | Use TLS (true = port 465)                      |
| `EMAIL_SMTP_USER`                        | yes      | —                       | SMTP username                                  |
| `EMAIL_SMTP_PASS`                        | yes      | —                       | SMTP password                                  |
| `EMAIL_FROM_ADDRESS`                     | yes      | —                       | Sender email address                           |
| `EMAIL_FROM_NAME`                        | no       | `Inmobo`                | Sender display name                            |

---

## DB Collection: `password_resets`

Must be created manually in the Appwrite Console (or via the Management API).
**No user-level permissions** — accessed exclusively via API key from this function.

| Attribute     | Type     | Size | Required | Default | Notes                                    |
| ------------- | -------- | ---- | -------- | ------- | ---------------------------------------- |
| `userId`      | string   | 64   | yes      | —       | Appwrite Auth UID                        |
| `email`       | string   | 254  | yes      | —       | Snapshot of user email at creation       |
| `token`       | string   | 64   | yes      | —       | `ID.unique()` lookup key                 |
| `expireAt`    | datetime | —    | yes      | —       | ISO 8601 UTC                             |
| `used`        | boolean  | —    | no       | false   | Marked true after successful reset       |
| `invalidated` | boolean  | —    | no       | false   | Marked true when a newer token is issued |

Required indexes:

| Index Name              | Type | Attributes     |
| ----------------------- | ---- | -------------- |
| `uq_pwreset_token`      | uq   | `token ↑`      |
| `idx_pwreset_userid`    | idx  | `userId ↑`     |
| `idx_pwreset_email`     | idx  | `email ↑`      |
| `idx_pwreset_createdat` | idx  | `$createdAt ↓` |

---

## Frontend integration

- **`ForgotPassword.jsx`** calls `authService.requestPasswordRecovery(email)`.
- **`ResetPassword.jsx`** reads `?token=` from the URL and calls
  `authService.resetPassword({ token, password })`.
- Both methods in `authService.js` use `executeJsonFunction(env.appwrite.functions.sendPasswordReset, payload)`.
- ENV key on the frontend: `APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID=send-password-reset`.

---

## Dependencies

```json
{
  "node-appwrite": "^17.0.0",
  "nodemailer": "^6.9.16"
}
```
