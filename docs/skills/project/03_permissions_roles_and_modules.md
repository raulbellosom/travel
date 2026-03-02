# 03 Permissions, Roles, and Modules

References:

- `../../core/05_permissions_and_roles.md`
- `../../core/06_appwrite_functions_catalog.md`

## Roles

- `root`, `owner`, `staff_manager`, `staff_editor`, `staff_support`, `client`, `visitor`.

## Module gates

- Enforced in backend functions.
- Disabled module -> `403 MODULE_DISABLED`.

## Do

- Enforce least privilege.
- Validate role and scope server-side.

## Don't

- Treat frontend guards as security.
- Grant broad API key scopes by default.
