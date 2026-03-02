# 09_AGENT_USAGE_GUIDE

## Purpose

Quick guide for AI agents working in this repository.
This file is helper documentation, not canon.

Canonical source of truth is `docs/core/*`.

## Required read order

1. `../core/00_ai_project_context.md`
2. `../core/00_project_brief.md`
3. `../core/01_frontend_requirements.md`
4. `../core/02_backend_appwrite_requirements.md`
5. `../core/03_appwrite_db_schema.md`
6. `../core/05_permissions_and_roles.md`
7. `../core/06_appwrite_functions_catalog.md`
8. `../core/07_frontend_routes_and_flows.md`
9. `../core/08_env_reference.md`
10. `../core/09_appwrite_platform_limits.md`
11. `../core/00_documentation_rules.md`

## Mandatory agent rules

- Do not contradict `../core/00_ai_project_context.md`.
- Do not propose schema/function names above naming budgets in `../core/09_appwrite_platform_limits.md`.
- Public can browse resources; interaction requires login.
- Marketing forms are separate from platform lead/chat operations.
- If editing docs, avoid duplication and link to the owner canon doc.

## Change checklist

1. Update the owning canonical doc first.
2. Sync related docs only if needed.
3. Keep `docs/README.md` current when structure changes.
4. Keep prompts in `../_archive/prompts/` only.

## Common task pointers

- Schema changes: `../core/03_appwrite_db_schema.md`
- Function auth/scopes: `../core/06_appwrite_functions_catalog.md`
- Route/guard behavior: `../core/07_frontend_routes_and_flows.md`
- Env variables: `../core/08_env_reference.md`

Last update: 2026-03-02
Version: 2.0.0
