# Inmobo Frontend

Frontend base for Inmobo in a single-tenant per-instance model.

- This repository is the demo/base instance.
- Each customer gets an isolated deployment (frontend + Appwrite).
- Customer data is never shared between instances.

## Product objective

Provide teams a platform to:

- publish and manage resources;
- handle authenticated leads/chat/reservations/payments/reviews;
- operate internal staff with role/module permissions;
- maintain full auditability with hidden root tooling.

## Stack

- React + Vite (JavaScript)
- TailwindCSS
- Appwrite (Auth, Databases, Storage, Functions)
- i18n (Spanish-first, multilingual)

## Documentation

Canonical docs now live in structured folders:

- Main index: `docs/README.md`
- Source of truth: `docs/core/*`
- Supporting material: `docs/guides`, `docs/runbooks`, `docs/migrations`
- Historical: `docs/_archive`
- AI skills helpers: `docs/skills/project/00_skills_index.md`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Plan tracking

Use `docs/core/10_master_plan_checklist.md` as the official execution checklist.
