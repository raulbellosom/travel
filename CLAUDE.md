# CLAUDE.md (INMOBO)

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Canon (non-negotiable)

- Canon lives ONLY in `docs/core/*`. If it isn't there, it isn't truth.
- Never contradict `docs/core/00_ai_project_context.md`.
- Respect Appwrite naming budgets and constraints from `docs/core/09_appwrite_platform_limits.md`.
- Interaction with resources requires authentication (no anonymous leads/chat/reservations).
- Marketing forms are isolated from platform leads/chat/reservations.
- Frontend route guards improve UX; **all security enforcement must be backend-side** (Appwrite Functions + permissions).
- Prompts belong only in `docs/_archive/prompts/`.

---

## Current mission focus

Finish the **"manual reservations via leads + chat"** flow end-to-end in **platform mode**:

1. Authenticated user submits contact intent (form/chat) -> creates **lead** + **conversation/messages**.
2. Staff/owner handles lead in inbox/chat -> can issue a **manual reservation** (no online payment) via function:
   - `create-reservation-manual`
3. All **module gates + permission checks** must be enforced in **Appwrite Functions**.
4. UX must be **mobile-first** and consistent.

### Hard rules

- Do not use browser native dialogs (`alert/prompt/confirm`) anywhere in platform flows.
- Do not add mock data in real flows.
- Any required schema/function change must update owner canon docs in `docs/core/*`.
- Ensure errors are handled with canonical codes: **401/403/422/409** as documented.

### Validation requirements

- Provide a short smoke-test checklist and prove each step by pointing to code paths updated.
- Do not auto-commit; propose diffs first. I will decide commits.

---

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # ESLint (flat config, eslint.config.js)
npm run test         # Node built-in test runner (--experimental-specifier-resolution=node)
npm run validate-pwa # Validate PWA icons/manifest (node validate-pwa.cjs)
```

Tests live alongside source files and use Node's built-in `node:test` module (no Jest/Vitest).

---

## Architecture Overview

This is **Inmobo**, a multi-surface real estate SaaS platform. Each customer deployment is single-tenant (isolated frontend + Appwrite project + data). This repo is the base/demo instance.

### Surface modes

The UI mode is controlled by `instance_settings.uiMode` (loaded at runtime from Appwrite):

- **`marketing`** – CRM landing page at `/`; marketplace routes redirect to `/`
- **`platform`** – Public resource marketplace at `/`; full admin panel enabled

Fallback resolution order: `uiMode` → legacy `marketingEnabled` → local `FEATURE_MARKETING_SITE` env var.

The `InstanceUiModeGate` component in `src/routes/AppRoutes.jsx` applies this gate at the top of the route tree.

---

## Backend: Appwrite

All backend operations go through **Appwrite** (self-hosted at `appwrite.racoondevs.com`). The client is initialized in `src/api/appwriteClient.js` and exports `account`, `databases`, `storage`, `functions`.

- **Direct DB reads** are used for queries by services in `src/services/`
- **Mutations that require auth/audit/business logic** go through Appwrite Functions in `functions/`
- Never write directly to sensitive collections (leads, reservations, payments, activity_logs) from the frontend

---

## Environment variables

Variables are injected at build time via `vite.config.js` into `globalThis.__TRAVEL_ENV__`.
The frontend reads them exclusively through `src/env.js` (never use `import.meta.env.VITE_*` for new code).
`.env` files use bare `APP_*` / `APPWRITE_*` keys without the `VITE_` prefix.

See `docs/core/08_env_reference.md` for the complete env contract.

---

## Route guards

Located in `src/routes/`, applied as JSX wrappers in `AppRoutes.jsx`:

| Guard             | Access                                  |
| ----------------- | --------------------------------------- |
| `ProtectedRoute`  | Any authenticated session               |
| `PublicOnlyRoute` | Unauthenticated only (login/register)   |
| `ClientRoute`     | `client` role                           |
| `InternalRoute`   | Internal roles (owner, staff\_\*, root) |
| `OwnerRoute`      | `owner` or `root`                       |
| `ScopeRoute`      | Specific scope (e.g. `resources.write`) |
| `RootRoute`       | `root` only                             |

Internal dashboard is always at `/app/*`. Route helpers and canonical names live in `src/utils/internalRoutes.js`.

---

## Roles

`root` > `owner` > `staff_manager` > `staff_editor` > `staff_support` > `client` > `visitor`

- `root` must not appear in customer-facing UI lists
- Frontend guards improve UX; all security enforcement is backend-side

---

## Canonical entity: `resource`

The domain entity is **resource** (not "property"). Legacy aliases (`property`, `propiedad`) exist in code marked `@deprecated`.
In new code, always use `resource`/`resources`.

---

## Contexts (provider order in AppRoutes)

`AuthProvider` → `InstanceModulesProvider` → `UIProvider` → `ToastProvider` → `ChatProvider`

- `AuthContext` – current user, session, role
- `InstanceModulesContext` – `instance_settings` (modules, uiMode, limits)
- `UIContext` – theme, sidebar state
- `ToastContext` – global toast notifications
- `ChatContext` – real-time messaging state

---

## Interaction gating (non-negotiable)

Resource detail pages are publicly viewable.
Any interaction (lead creation, chat, booking intent, favorites) requires authentication.
Unauthenticated users must be redirected to `/login?redirect=<current-path>`.
Never use `window.prompt`, `window.confirm`, or `window.alert`—use inline UI panels.

---

## i18n

Primary language: **Spanish**.
Routes have bilingual aliases (e.g. `/recursos/:slug` and `/resources/:slug` both work).
Translation files are in `src/i18n/` (`es.json`, `en.json`, `client_es.json`, `client_en.json`, `landing_es.json`, `landing_en.json`).
Use `react-i18next` hooks (`useTranslation`).

---

## Design system

- **Mobile-first**: Design for 360–640px first, expand upward. Min touch target: 44×44px.
- **Icons**: Lucide React only. No emoji icons, no PNG icons.
- **Animations**: Framer Motion. Keep under 300ms, respect `prefers-reduced-motion`.
- **Colors**: Primary `#0ea5e9` (sky-500). CSS tokens defined in `src/styles/tokens.css`.
- **Font**: Inter (Google Fonts).
- **Dark mode**: Supported via `.dark` class on root; use `UIContext`.

---

## Appwrite Functions (in `functions/`)

Each subdirectory is an independent Node.js Appwrite Function with its own `package.json`.
Functions handle all sensitive mutations and emit `activity_logs` entries for auditable events.
Functions are invoked from the frontend via `functions.createExecution(functionId, body)`.

Key functions include:
`create-lead`, `create-reservation-public`, `create-reservation-manual`, `create-payment-session`,
`issue-reservation-voucher`, `payment-webhook-stripe`, `payment-webhook-mercadopago`, `get-resource-availability`.

---

## Working agreement (how to operate)

When implementing changes:

1. Read relevant canon docs in `docs/core/*` first.
2. Trace the end-to-end flow, identify the exact breakpoints (file paths + cause).
3. Implement the smallest safe fix.
4. Show diffs and a smoke-test checklist.
5. Update `docs/core/*` only if a real contract changed (schema/function behavior). Otherwise, do not touch canon docs.

---

## Source of truth

All architecture decisions are documented in `docs/core/`. Nothing outside that directory is authoritative.
`docs/core/00_ai_project_context.md` is the root context that no document may contradict.

```

```
