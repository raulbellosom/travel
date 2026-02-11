# staff-user-management

HTTP function to manage staff users from the owner/root panel.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- HTTP endpoint (POST, authenticated owner/root)

## Action implemented

- `create_staff`

## Payload

```json
{
  "action": "create_staff",
  "fullName": "Juan Perez",
  "email": "juan.staff@cliente.com",
  "password": "S3gura!2026",
  "role": "staff_support",
  "scopes": ["leads.read", "reservations.read"]
}
```

Allowed role values:

- `staff_manager`
- `staff_editor`
- `staff_support`

## Behavior

- Validates caller is authenticated and has role `owner` or `root`.
- Validates email format.
- Validates password strength (min 8 chars + at least 3 categories).
- Creates auth user in Appwrite Auth.
- Ensures/updates profile in `users` collection with the selected staff role.
- Ensures `user_preferences` document exists.
- Writes `staff.create` in `activity_logs` when configured.

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
