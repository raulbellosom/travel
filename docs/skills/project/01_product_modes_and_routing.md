# 01 Product Modes and Routing

References:

- `../../core/00_ai_project_context.md`
- `../../core/07_frontend_routes_and_flows.md`

## Core model

- Mode 1: CRM marketing landing.
- Mode 2: Customer admin panel.
- Mode 3: Customer resources landing.

Source of truth: `instance_settings.uiMode`.

## Do

- Render marketing-only surface when `uiMode=marketing`.
- Render marketplace surface when `uiMode=platform`.
- Keep admin routes available to authorized users.

## Don't

- Mix marketing forms with platform leads/chat/reservations.
- Assume fallback flags before reading instance settings.
