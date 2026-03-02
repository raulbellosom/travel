# 04 DB Conventions and Naming

References:

- `../../core/03_appwrite_db_schema.md`
- `../../core/09_appwrite_platform_limits.md`

## Naming budgets

- IDs: `<=36`
- Attribute keys: `<=32`
- Index names: `<=36`

## Standards

- Keep current operational keys as canonical.
- New schema additions use `snake_case`.
- Prefer short IDs and short index names.

## Do

- Define type, required/default, constraints, index/unique, and why.
- Prefer single-field indexes.

## Don't

- Propose long composite indexes on large strings.
- Model typed fields as generic strings (`email`, `url`, `ip`).
