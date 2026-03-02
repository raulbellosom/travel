# 00_DOCUMENTATION_RULES

## Canon ownership

Authoritative canon lives only in `docs/core/`:

- `00_ai_project_context.md`: product truth, non-negotiable rules.
- `00_project_brief.md`: business scope and user value.
- `01_frontend_requirements.md`: frontend architecture requirements.
- `02_backend_appwrite_requirements.md`: backend architecture requirements.
- `03_appwrite_db_schema.md`: Appwrite data model and query/index contract.
- `04_design_system_mobile_first.md`: design system and UI rules.
- `05_permissions_and_roles.md`: role, scope, and module gating policy.
- `06_appwrite_functions_catalog.md`: function contracts and auth/scopes.
- `07_frontend_routes_and_flows.md`: route map and UX gating.
- `08_env_reference.md`: environment variable contract.
- `09_appwrite_platform_limits.md`: Appwrite 1.8.1 limits and naming budgets.
- `10_master_plan_checklist.md`: execution checklist and progress.

## Rules

1. If it is not in `docs/core/`, it is not authoritative.
2. Prompts are never canonical and must live in `docs/_archive/prompts/`.
3. Do not duplicate rules across files; link to the owner doc instead.
4. No document may contradict `docs/core/00_ai_project_context.md`.
5. No schema/function proposal may violate `docs/core/09_appwrite_platform_limits.md`.
6. Skills under `docs/skills/` are helpers, not canon.
7. Skills must reference canon docs instead of copying full specs.
