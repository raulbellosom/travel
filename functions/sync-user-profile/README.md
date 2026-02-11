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

- Solo actualiza el perfil del usuario autenticado.
- No acepta `userId` desde body.
- Usa identidad confiable del runtime/header de Appwrite.
- Valida metodo/identidad/payload con util local `src/_request.js` (aislado por function).

## Variables de entorno

Ver `.env.example`.

## Scopes API Key mínimos

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`
