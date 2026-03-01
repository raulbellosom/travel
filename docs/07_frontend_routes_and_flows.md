# 07_FRONTEND_ROUTES_AND_FLOWS - RESOURCE PLATFORM

## Referencia

- `01_frontend_requirements.md`
- `05_permissions_and_roles.md`
- `06_appwrite_functions_catalog.md`

---

## 1. Principios

1. Mobile-first.
2. Frontend guards are UX only; backend is the final authority.
3. Backend validates permissions/modules/limits for every mutation.
4. Strict separation between marketing landing and platform operations.

---

## 2. Global UI Mode (instance settings)

Frontend source of truth: `instance_settings.uiMode`.

- `uiMode = marketing`:
  - show only marketing landing for public surface (`/`).
  - hide marketplace public routes (search, detail, reserve, voucher, etc.).
  - keep auth routes and `/app/*` panel routes available.
  - platform mutations (`create-lead`, proposal actions) are blocked server-side.
- `uiMode = platform`:
  - show full marketplace + admin platform routes.
  - `/` renders platform catalog.

Fallbacks:

- If `uiMode` is missing, fallback to `marketingEnabled`.
- If `instance_settings` is unavailable, fallback local env `FEATURE_MARKETING_SITE`.

---

## 3. Global Guards

- `ProtectedRoute`
- `InternalRoute`
- `RoleRoute`
- `ScopeRoute`
- `RootRoute`

---

## 4. Public Route Surface

### 4.1 Platform mode (`uiMode=platform`)

| Route                | Description                               |
| -------------------- | ----------------------------------------- |
| `/`                  | platform home/catalog                     |
| `/recursos/:slug`    | public resource detail                    |
| `/resources/:slug`   | public resource detail (alias)            |
| `/propiedades/:slug` | legacy redirect to `/recursos/:slug`      |
| `/properties/:slug`  | legacy redirect to `/resources/:slug`     |
| `/reservar/:slug`    | reserve/request page                      |
| `/reserve/:slug`     | reserve/request page (alias)              |
| `/voucher/:code`     | voucher lookup                            |
| `/login`             | auth                                      |
| `/register`          | auth                                      |

### 4.2 Marketing mode (`uiMode=marketing`)

| Route | Description |
| ----- | ----------- |
| `/`   | SaaS marketing landing |

Marketplace public routes redirect to `/` while marketing mode is active.
Auth routes and `/app/*` remain available.

### 4.3 Marketing contact form (public landing)

- Form fields:
  - `firstName` (required, max 60)
  - `lastName` (required, max 60)
  - `email` (required)
  - `phone` (optional, pattern `+52 123 123 1234`)
  - `message` (required)
- Frontend auto-formats phone while typing to `+52 123 123 1234`.
- Submit target: `create-marketing-contact-public` only (never platform `leads`).

---

## 5. Private Route Surface

| Route                       | Guard            | Scope/Role                       |
| -------------------------- | ---------------- | -------------------------------- |
| `/app/dashboard`           | `InternalRoute`  | internal                         |
| `/app/my-properties`       | `ScopeRoute`     | `resources.read`                 |
| `/app/properties/new`      | `ScopeRoute`     | `resources.write`                |
| `/app/properties/:id/edit` | `ScopeRoute`     | `resources.write`                |
| `/app/leads`               | `ScopeRoute`     | `leads.read`                     |
| `/app/conversations`       | `ScopeRoute`     | `messaging.read`                 |
| `/app/reservations`        | `ScopeRoute`     | `reservations.read`              |
| `/app/calendar`            | `ScopeRoute`     | `reservations.read`              |
| `/app/payments`            | `ScopeRoute`     | `payments.read`                  |
| `/app/reviews`             | `ScopeRoute`     | `reviews.moderate`               |
| `/app/team`                | `ScopeRoute`     | `staff.manage`                   |
| `/app/activity`            | `RootRoute`      | root only                        |
| `/app/amenities`           | `RootRoute`      | root only                        |
| `/app/root/instance`       | `RootRoute`      | root only                        |
| `/perfil`                  | `ProtectedRoute` | authenticated user               |
| `/mis-favoritos`           | `ProtectedRoute` | authenticated user               |
| `/mis-reservas`            | `ProtectedRoute` | authenticated client             |
| `/mis-conversaciones`      | `ProtectedRoute` | authenticated user               |

---

## 6. Auth-Gated Resource Interactions

On `PropertyDetail` and resource CTAs:

- Not authenticated:
  - hide contact/chat actions.
  - show login CTA (`/login?redirect=<current-route>`).
- Authenticated but not eligible (`!client`, owner of resource, or unverified email):
  - block chat/contact creation and show validation guidance.
- Authenticated + verified `client`:
  - can create lead/chat through `create-lead` only.

Non-negotiable behavior:

- No platform lead/chat/contact creation without authentication.
- Marketing forms remain separate and do not write to platform leads/conversations/messages.

---

## 7. Resource Behavior -> Lead Intent + Channel + Structured Meta

Frontend derives interaction mode from resource behavior:

- `sale` or `rent_long_term` -> `visit_request`
- `rent_short_term + manual_contact` -> `booking_request_manual`
- normal short-term booking/contact -> `booking_request` or `info_request`

Create-lead submit contract from UI:

- `intent`: one of `booking_request | booking_request_manual | visit_request | info_request`
- `contactChannel`: `resource_chat` or `resource_cta_form`
- `meta` canonical nodes:
  - `resourceSnapshot`
  - `booking`
  - `visit`
  - `contactPrefs`

Validation by UX before submit:

- `visit_request` requires at least one preferred slot.
- `booking_request_manual` requires guests and date range.

---

## 8. Actionable Chat Proposals

`ChatMessage` renders by `message.kind`:

- `text`: default bubble
- `proposal`: proposal card with schedule + meeting data + actions
- `proposal_response`: response bubble with action metadata

Proposal actions:

- Internal users (`owner/root/staff`) send proposal -> `send-proposal`.
- Client responds with `accept | reject | request_change` -> `respond-proposal`.

---

## 9. Archive vs Finalize UX Semantics

Archive:

- UI/inbox state only.
- conversation status -> `archived`
- lead -> `isArchived=true`
- lead pipeline status unchanged.

Finalize:

- resolved outcome.
- conversation status -> `closed`
- lead status required -> `closed_won` or `closed_lost`
- optional closure reason stored in `metaJson.closureReason`.

Reopen policy:

- Archived conversation + new client message -> reopen `active`, clear lead archive flag.
- Closed flow should create a new lead instance for new requests (clean analytics).

---

## 10. Expected Errors

- `401 AUTH_REQUIRED`
- `403 MODULE_DISABLED`
- `403 PLATFORM_MODE_REQUIRED`
- `403 LIMIT_EXCEEDED`
- `422 VALIDATION_ERROR`
- `409 CONFLICT`

---

## 11. Favorites and Sharing (public detail)

- `Share` action: uses `navigator.share`, fallback to clipboard URL copy.
- `Favorites` action:
  - authenticated user: persistent toggle in `favorites` collection.
  - unauthenticated user: redirect to `/register?redirect=<current-route>`.

---

Last update: 2026-03-01
Version: 3.7.1
