# 07_FRONTEND_ROUTES_AND_FLOWS - MODES + INTERACTION GATING

## Referencias

- `01_frontend_requirements.md`
- `05_permissions_and_roles.md`
- `06_appwrite_functions_catalog.md`
- `09_appwrite_platform_limits.md`

---

## 1. Base rules

1. Mobile-first.
2. Frontend guards improve UX; backend enforces security.
3. Marketing and platform operations are isolated.
4. Resource browsing may be public; resource interaction is auth-gated.

---

## 2. Global mode source of truth

`instance_settings.uiMode`:

- `marketing`
  - `/` shows CRM marketing landing.
  - marketplace public routes redirect to `/`.
  - auth routes and `/app/*` remain available.
  - platform mutations are blocked server-side.
- `platform`
  - `/` shows marketplace home/catalog.
  - marketplace + admin routes are enabled.

Fallback order:

1. `uiMode`
2. legacy `marketingEnabled`
3. local `FEATURE_MARKETING_SITE`

---

## 3. Route guards

- `ProtectedRoute`: authenticated session required.
- `InternalRoute`: internal role area.
- `RoleRoute`: role check.
- `ScopeRoute`: scope check.
- `RootRoute`: `root` only.

---

## 4. Public routes

### 4.1 Platform mode (`uiMode=platform`)

| Route                | Use                          |
| -------------------- | ---------------------------- |
| `/`                  | marketplace home/catalog     |
| `/recursos/:slug`    | public resource detail       |
| `/resources/:slug`   | public resource detail alias |
| `/propiedades/:slug` | legacy alias                 |
| `/properties/:slug`  | legacy alias                 |
| `/reservar/:slug`    | reserve/intent entry         |
| `/reserve/:slug`     | alias                        |
| `/voucher/:code`     | voucher lookup               |
| `/login`             | login                        |
| `/register`          | register                     |

### 4.2 Marketing mode (`uiMode=marketing`)

| Route | Use                   |
| ----- | --------------------- |
| `/`   | CRM marketing landing |

Marketing contact/newsletter are public and write only to marketing collections.

---

## 5. Private routes (examples)

| Route                 | Guard            | Access               |
| --------------------- | ---------------- | -------------------- |
| `/app/dashboard`      | `InternalRoute`  | internal roles       |
| `/app/my-properties`  | `ScopeRoute`     | `resources.read`     |
| `/app/properties/new` | `ScopeRoute`     | `resources.write`    |
| `/app/leads`          | `ScopeRoute`     | `leads.read`         |
| `/app/conversations`  | `ScopeRoute`     | `messaging.read`     |
| `/app/reservations`   | `ScopeRoute`     | `reservations.read`  |
| `/app/payments`       | `ScopeRoute`     | `payments.read`      |
| `/app/reviews`        | `ScopeRoute`     | `reviews.moderate`   |
| `/app/team`           | `ScopeRoute`     | `staff.manage`       |
| `/app/activity`       | `RootRoute`      | root only            |
| `/perfil`             | `ProtectedRoute` | authenticated user   |
| `/mis-favoritos`      | `ProtectedRoute` | authenticated user   |
| `/mis-reservas`       | `ProtectedRoute` | authenticated client |
| `/mis-conversaciones` | `ProtectedRoute` | authenticated user   |

---

## 6. Interaction gating (non-negotiable)

Resource detail pages are public to view, but interaction entry points are gated.

| Entry point                              | Visitor behavior                      | Authenticated behavior        |
| ---------------------------------------- | ------------------------------------- | ----------------------------- |
| Inline BookingContactBlock               | show auth CTA                         | compose message + submit lead |
| Calendar date selection (manual_contact) | show auth CTA                         | scroll to BookingContactBlock |
| Reserve intent                           | show CTA + redirect                   | continue reservation flow     |
| Favorite/save                            | show CTA + redirect                   | toggle favorite               |
| Any lead/message mutation                | blocked client-side + backend 401/403 | allowed by role/module rules  |

**BookingContactBlock** (v2) replaces the previous chat modal + `window.prompt` approach:

- Rendered inline on resource detail pages (mobile + desktop).
- Provides channel selector (`IN_PLATFORM`, `WHATSAPP`, `EMAIL`).
- Supports `SCHEDULE_MEETING` intent with meeting proposal (date/time/mode/duration).
- Supports `AVAILABILITY_INQUIRY` intent with date range picker.
- Handles auth gating inline (shows login/register CTA for visitors).
- No native browser dialogs (`window.prompt`, `window.confirm`, `window.alert`) anywhere in the flow.

Redirect pattern:

- `/login?redirect=<current-path>`
- `/register?redirect=<current-path>`

Implementation expectation:

- Interaction pages and mutation screens use `ProtectedRoute`.
- All staff/admin dialogs in Conversations page use inline panels, not native browser dialogs.

---

## 7. Marketing form separation

Marketing forms must call only:

- `create-marketing-contact-public`
- `create-newsletter-subscription-publi`

They must never write to:

- `leads`
- `conversations`
- `messages`
- `reservations`

---

## 8. Expected errors

- `401 AUTH_REQUIRED`
- `403 MODULE_DISABLED`
- `403 PLATFORM_MODE_REQUIRED`
- `403 PERMISSION_DENIED`
- `422 VALIDATION_ERROR`
- `409 CONFLICT`

---

## See also

- `../skills/project/06_frontend_routes_patterns.md`

---

Last update: 2026-03-02
Version: 4.0.0
