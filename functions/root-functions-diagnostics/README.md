# root-functions-diagnostics

Root-only diagnostics for Appwrite Functions.

## Execution Contract

- Type: HTTP Function.
- Appwrite trigger: direct execution of `root-functions-diagnostics`.
- Method: `POST`.
- `execute` permission: `users`.
- Actor scope/role: authenticated user with `users.role = root`.

## Minimum API key scopes

- `databases.read`
- `functions.read`
- `functions.write` (required only when `includeSmoke=true`)

## Payload

```json
{
  "includeSmoke": false
}
```

`includeSmoke: true` runs non-destructive smoke executions.

## Env Validation Source

The diagnostics engine validates env keys using the union of:

- Function-level variables (`Functions.listVariables`).
- Runtime globals visible in `process.env` (project/global env injected by Appwrite).
