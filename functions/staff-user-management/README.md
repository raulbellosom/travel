# staff-user-management

HTTP function to manage staff users from the team management panel.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST, authenticated owner/root or user with `staff.manage`)

## Actions implemented

- `create_staff`
- `list_staff`
- `update_staff`
- `set_staff_enabled`

## Payload

```json
{
  "action": "create_staff",
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan.staff@cliente.com",
  "password": "S3gura!2026",
  "role": "staff_support",
  "scopes": ["leads.read", "reservations.read"],
  "avatarFileId": "optional_file_id_from_avatars_bucket"
}
```

Allowed role values:

- `staff_manager`
- `staff_editor`
- `staff_support`

## Behavior

- Validates caller is authenticated and is `owner`/`root`, or has `staff.manage`.
- Validates email format.
- Validates password strength (min 8 chars + at least 3 categories).
- Creates auth user in Appwrite Auth.
- Ensures/updates profile in `users` collection with the selected staff role.
- Stores fine-grained permissions in `users.scopesJson`.
- Ensures `user_preferences` document exists.
- Supports avatar assignment by writing `avatarFileId` in Auth `prefs`.
- Allows authorized actors to list staff users.
- Allows authorized actors to update staff role/scopes.
- Allows authorized actors to update staff avatar.
- Allows authorized actors to enable/disable staff (`enabled` flag).
- Blocks management of `root` and `owner` accounts.
- Writes staff audit events in `activity_logs` when configured.

## Environment

Uses shared Appwrite env vars from `.env.example`.

Required:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_COLLECTION_USERS_ID`

Optional:

- `APPWRITE_COLLECTION_USER_PREFERENCES_ID`
- `APPWRITE_COLLECTION_ACTIVITY_LOGS_ID`
