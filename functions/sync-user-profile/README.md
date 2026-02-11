# sync-user-profile

Sincroniza cambios de perfil entre:

- `users` collection (database)
- usuario de Appwrite Auth

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Tipo

- HTTP endpoint (invocada por frontend autenticado)

## Seguridad

- Usa `APPWRITE_FUNCTION_USER_ID` como fuente de verdad.
- Solo permite actualizar el perfil del usuario autenticado.

## Variables de entorno

Ver `.env.example`.

## Scopes API Key mínimos

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`
