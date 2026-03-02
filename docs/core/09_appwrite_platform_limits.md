# 09_APPWRITE_PLATFORM_LIMITS (Appwrite 1.8.1)

Endpoint operativo: `https://appwrite.racoondevs.com` (self-hosted).

## 1) Hard budgets (use these limits)

- `databaseId`, `collectionId`, `functionId`, `bucketId`: `<= 36` chars.
- `attribute_key`: `<= 32` chars (recommended hard budget for this project).
- `index_name`: `<= 36` chars (recommended hard budget).

Naming rules:

- Use short, stable IDs (`resources`, `leads`, `chat_messages`).
- Use `snake_case` for new collection IDs, attribute keys, enum keys, and index names.
- Keep IDs human-readable and domain-specific.

## 2) Naming budget table

| Element | Max length | Pattern | Good | Bad |
| --- | --- | --- | --- | --- |
| `collectionId` | 36 | short noun in `snake_case` | `resources`, `rate_plans` | `resources_and_ads_for_customer_marketplace` |
| `attribute_key` | 32 | concise semantic key | `resource_id`, `starts_at` | `the_resource_owner_user_profile_document_reference_id` |
| `index_name` | 36 | `idx_<entity>_<field>` | `idx_leads_status` | `idx_resources_search_by_vertical_and_location_and_dates` |
| `functionId` | 36 | verb-object style | `create-lead`, `send-proposal` | `create-resource-contact-and-booking-intent-function` |

Stop rule:

- If any proposed ID exceeds budget, shorten immediately and explain the final name.

## 3) Index design rules (avoid MySQL length failures)

Do:

- Index IDs and small categorical fields (`status`, `role`, `resourceId`).
- Prefer single-field indexes.
- Use composite indexes only when query plans require them (usually 2 fields).
- Use unique indexes only for explicit uniqueness requirements.

Do not:

- Composite-index multiple long strings.
- Index large free-text fields (`description`, `notes`, long JSON strings).
- Over-index every field "just in case".

Practical note:

- Appwrite deployments commonly run on MySQL-compatible backends where key length limits can break wide composite indexes.

## 4) Appwrite attribute types used in this project

Use real Appwrite types in docs and schema proposals:

- `string` (requires explicit max length)
- `integer`
- `float`
- `boolean`
- `datetime` (ISO 8601)
- `enum`
- `email`
- `url`
- `ip`
- `relationship`

Length rule:

- `string` must declare max length.
- `email`, `url`, `ip` are typed validated attributes and do not need custom length in this canon unless a platform constraint forces it.

## 5) Attribute documentation contract

For each schema field, always document:

- `required`: yes/no
- `default`: value or `-`
- `constraints`: max length, min/max, enum values, regex, logical rules
- `unique`: yes/no (or unique index name)
- `index`: yes/no (index name when applicable)
- `why`: short purpose sentence

## 6) Function auth modes and execution context

Each function entry must declare one mode:

- `authenticated_session`: called by logged-in user execution context.
- `api_key_only`: backend/server automation only.
- `public`: callable without login (`any` execute). Keep rare.

For each function, document:

- trigger (`HTTP`, event, cron)
- execute permission (`users`, `any`, `[]`)
- required business roles (`root/admin/client/...`)
- module gate (if any)
- minimum API key scopes

## 7) API keys and scope governance

Document API key usage explicitly:

- Key reference in this project:
  - `APPWRITE_FUNCTION_API_KEY` (runtime key for functions)
  - optional admin/server key for tooling or migrations (`SERVER_ADMIN_KEY` style, if introduced)
- Principle: least privilege by function.
- Never use broad scopes when narrower scopes are enough.

Common scope groups:

- `databases.read`
- `databases.write`
- `users.read`
- `users.write`
- `functions.read`
- `functions.write` (only where a function executes another function)

## 8) Practical operational limits in this project

Known constraints documented in current canon:

- Bucket upload caps:
  - `resource-images`: 10 MB
  - `avatars`: 5 MB
  - `documents`: 20 MB
- JSON payload fields are size-bounded (example: lead/chat `metaJson` around `8000` chars in function contracts).
- Function IDs are capped at 36 chars; use shortened IDs when name exceeds limit.

Rate-limit guidance:

- Client-side/public function calls are subject to request-rate controls.
- Server SDK/API key executions typically avoid some end-user limits, but operational throttling and infra limits still apply.

## 9) Enforcement checklist for AI agents

Before proposing schema/functions:

1. Validate all IDs and index names against budgets.
2. Validate type selection (`email` != `string email`, `url` != `string url`).
3. Validate index strategy against query needs.
4. Validate auth mode and caller role for each function.
5. Validate minimum API key scopes.
