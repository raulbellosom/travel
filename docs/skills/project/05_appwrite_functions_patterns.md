# 05 Appwrite Functions Patterns

References:

- `../../core/06_appwrite_functions_catalog.md`
- `../../core/09_appwrite_platform_limits.md`

## Function entry template

- Function ID
- Trigger
- Auth mode
- Execute permission
- Required roles
- Required API key scopes
- Module gate
- Collections touched

## Do

- Document minimum scopes explicitly.
- Keep function IDs within naming budget.
- Distinguish `authenticated_session`, `api_key_only`, and `public`.

## Don't

- Leave auth mode ambiguous.
- Use API keys with unnecessary scopes.
