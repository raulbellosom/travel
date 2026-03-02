# 06 Frontend Routes Patterns

References:

- `../../core/07_frontend_routes_and_flows.md`
- `../../core/05_permissions_and_roles.md`

## Route grouping

- Public mode routes
- Private app routes
- Root-only routes

## Guard patterns

- `ProtectedRoute`
- `InternalRoute`
- `RoleRoute`
- `ScopeRoute`
- `RootRoute`

## Do

- Keep resource detail public-to-view.
- Gate all resource interaction mutations.

## Don't

- Expose mutation pages without auth.
- Mix marketing and platform route intents.
