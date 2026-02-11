# user-create-profile

Crea automaticamente perfil extendido (`users`) y preferencias (`user_preferences`)
cuando se registra un usuario en Appwrite Auth.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Trigger recomendado

- `users.*.create`

## Flujo

1. Lee payload del evento de Auth.
2. Crea documento `users` con `documentId = authUserId`.
3. Crea documento `user_preferences`.
4. Ejecuta function `email-verification` (si se configuro ID) para enviar correo de validacion.

## Roles de alta

- Rol por defecto: `client`.
- Bootstrap owner: si `userId` de Auth o email coincide con listas de bootstrap, el rol inicial sera `owner`.

Variables:

- `APPWRITE_DEFAULT_AUTH_ROLE=client` (`client` u `owner`)
- `APPWRITE_OWNER_AUTH_IDS=id1,id2`
- `APPWRITE_OWNER_EMAILS=admin@cliente.com`

## Variables de entorno

Ver `.env.example`.

## Scopes API Key minimos

- `databases.read`
- `databases.write`
- `functions.write` (si se ejecuta email-verification)
