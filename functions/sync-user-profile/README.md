# sync-user-profile

Synchronizes profile data between Auth user and `users` collection.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `sync-user-profile`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated user can update only its own profile.

## Minimum API key scopes

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`
- `functions.write` (required only if `APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID` is configured)

## Fields synchronized

- `firstName`
- `lastName`
- `email`
- `phone`
- `phoneCountryCode`
- `whatsappNumber`
- `whatsappCountryCode`
