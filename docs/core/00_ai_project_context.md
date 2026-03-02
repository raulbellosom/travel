# 00_AI_PROJECT_CONTEXT - RESOURCE PLATFORM

## Purpose

Root context for humans and AI agents.
No active document may contradict this file.

---

## 1. Product truth (non-negotiable)

The product has 3 modes/surfaces:

1. CRM marketing landing (Raul Belloso Medina)
   - Public marketing site to sell CRM instances.
   - Can include marketing-only contact/newsletter forms.
2. Customer admin panel
   - Enabled after purchase.
   - Used by internal customer roles (`owner`, `staff_*`, `root`).
3. Customer resources/ads landing (marketplace)
   - Replaces CRM marketing landing when instance is in platform mode.
   - Public browsing is allowed without login.
   - Any interaction requires authentication.

Interaction-gated actions (auth required):

- chat
- resource contact forms
- booking/reservation intent
- favorites/save
- any lead/message creation tied to resources

If user is unauthenticated, UI must show CTA and redirect to `/login` or `/register` with `redirect=<current>`.

Marketing forms are strictly separated from platform lead/chat/reservation operations.

---

## 2. Source of truth for mode routing

`instance_settings.uiMode` controls public surface behavior:

- `marketing`: CRM marketing landing
- `platform`: resources marketplace + admin operations

Fallback behavior may use local feature flags only when instance settings are unavailable.

---

## 3. Delivery model

- Single-tenant by deployment.
- This repository is a base/demo instance.
- Each customer gets isolated frontend + Appwrite project + data.
- No customer data mixing across instances.

---

## 4. Architecture principles

1. Mobile-first UX.
2. Backend-first security and validation.
3. Least privilege by role/scope.
4. Audit by default for sensitive mutations.
5. No mock data in real flows.

---

## 5. Stack (fixed)

Frontend:

- React + Vite
- JavaScript (no TypeScript)
- TailwindCSS

Backend:

- Appwrite self-hosted (`appwrite.racoondevs.com`)
- Auth, Databases, Storage, Functions, Messaging

Note:

- Underlying storage engine details are managed by Appwrite infrastructure and are not an application-level contract in this repo.

---

## 6. Roles

- `root` (internal, full control)
- `owner`
- `staff_manager`
- `staff_editor`
- `staff_support`
- `client` (authenticated end user)
- `visitor` (public browsing only)

`root` must not appear in customer operational UI lists.

---

## 7. Language and content

- Primary language: Spanish (UTF-8, including accents and n/ntilde usage).
- Product remains multilingual.

---

## 8. Compliance pointers

- Schema, IDs, attributes, indexes, and function auth/scopes must comply with:
  - `docs/core/09_appwrite_platform_limits.md`
- Documentation governance is defined in:
  - `docs/core/00_documentation_rules.md`

---

## See also

- `../skills/project/01_product_modes_and_routing.md`
- `../skills/project/02_auth_and_interaction_gating.md`

---

Last update: 2026-03-02
Version: 3.0.0
