# staff-user-management

Manage staff users from the team management panel.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `staff-user-management`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated actor with one of:
  - `role = owner`
  - `role = root`
  - scope `staff.manage`

## Minimum API key scopes

- `users.read`
- `users.write`
- `databases.read`
- `databases.write`

## Actions implemented

- `create_staff`
- `list_staff`
- `update_staff`
- `set_staff_enabled`

## Payload example

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
