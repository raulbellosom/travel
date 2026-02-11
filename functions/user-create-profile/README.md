# user-create-profile

Crea automáticamente perfil extendido (`users`) y preferencias (`user_preferences`) cuando se registra un usuario en Appwrite Auth.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Trigger recomendado

- `users.*.create`

## Flujo

1. Lee payload del evento de Auth.
2. Crea documento `users` con `documentId = authUserId`.
3. Crea documento `user_preferences`.
4. Ejecuta function `email-verification` (si se configuró ID) para enviar correo de validación.

## Variables de entorno

Ver `.env.example`.

## Scopes API Key mínimos

- `databases.read`
- `databases.write`
- `functions.write` (si se ejecuta email-verification)
