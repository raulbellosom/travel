# user-create-profile

Creates `users` and `user_preferences` after user signup in Appwrite Auth.

## Execution Contract

- Type: Event Trigger Function.
- Appwrite trigger: `users.*.create`.
- Method: no aplica (evento de Appwrite).
- `execute` permission: `[]`.
- Actor scope/role: no aplica.

## Minimum API key scopes

- `databases.read`
- `databases.write`
- `functions.write` (required only if `APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID` is configured)

## Role Assignment

- All new users are created with the `client` role by default.
- Role upgrades (to `owner`, `staff`, etc.) must be managed through the database by users with `root` privileges.
- This ensures proper access control and auditability.
