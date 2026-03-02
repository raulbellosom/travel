# 09 Testing and Acceptance Patterns

References:

- `../../core/07_frontend_routes_and_flows.md`
- `../../core/06_appwrite_functions_catalog.md`
- `../../core/05_permissions_and_roles.md`

## Minimum acceptance checklist

1. Mode routing works (`marketing` vs `platform`).
2. Public browse works without login.
3. Interaction gating redirects unauthenticated users.
4. Authenticated interaction succeeds by role/module.
5. Marketing forms write only to marketing collections.
6. Permission denials return expected error codes.

## Regression focus

- Auth gating
- Module toggles
- Role/scope enforcement
- Function auth mode and execute permissions
