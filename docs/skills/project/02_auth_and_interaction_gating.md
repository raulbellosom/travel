# 02 Auth and Interaction Gating

References:

- `../../core/00_ai_project_context.md`
- `../../core/07_frontend_routes_and_flows.md`

## Rule

Public users can browse resources.
Public users cannot interact with resources without login.

## Standard redirects

- `/login?redirect=<path>`
- `/register?redirect=<path>`

## Do

- Show CTA when unauthenticated user clicks chat/contact/reserve/favorite.
- Preserve redirect path.

## Don't

- Create platform leads/messages from anonymous users.
- Bypass backend auth checks.
