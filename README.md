# Inmobo Frontend

Frontend base para la aplicacion Inmobo en modelo single-tenant por
instancia:

- Este repo funciona como demo/plantilla base.
- Cada cliente final se despliega en una instancia dedicada (frontend + Appwrite).
- No se mezclan datos de diferentes clientes en la misma base de datos.

## Objetivo del producto

Entregar a agentes o equipos inmobiliarios una plataforma propia para:

- publicar y administrar propiedades;
- gestionar leads, reservas, pagos y reseñas;
- operar usuarios internos de staff con permisos por modulo;
- mantener auditoria completa con panel root oculto.

## Stack

- React + Vite (JavaScript)
- TailwindCSS
- Appwrite (Auth, Databases, Storage, Functions)
- i18n (es/en)

## Documentacion

La fuente de verdad vive en `docs/`:

1. `docs/00_ai_project_context.md`
2. `docs/00_project_brief.md`
3. `docs/01_frontend_requirements.md`
4. `docs/02_backend_appwrite_requirements.md`
5. `docs/03_appwrite_db_schema.md`
6. `docs/04_design_system_mobile_first.md`
7. `docs/05_permissions_and_roles.md`
8. `docs/06_appwrite_functions_catalog.md`
9. `docs/07_frontend_routes_and_flows.md`
10. `docs/08_env_reference.md`
11. `docs/10_master_plan_checklist.md`

## Estado actual (resumen)

- Existe base de autenticacion, perfil, propiedades, leads y design system.
- Existen functions: `user-create-profile`, `create-lead`,
  `send-lead-notification`, `email-verification`, `sync-user-profile`.
- Falta implementar rutas y modulos completos de reservas, pagos, staff,
  vouchers, reviews y actividad root segun `docs/07_frontend_routes_and_flows.md`.

## Scripts

- `npm run dev`: desarrollo local.
- `npm run build`: build de produccion.
- `npm run preview`: preview de build.
- `npm run lint`: validacion ESLint.

## Google Maps

Para usar mapas y geocodificacion, configura estas variables en `.env`:

- `GOOGLE_MAPS_API_KEY`: API key de Google Maps Platform.
- `GOOGLE_MAPS_MAP_ID` (opcional): Map ID para estilos cloud.

APIs requeridas en Google Cloud:

- Maps JavaScript API
- Places API
- Geocoding API

Se recomienda restringir la key por dominio (HTTP referrers) y por APIs permitidas.

## Plan maestro

Usar `docs/10_master_plan_checklist.md` como backlog oficial de ejecucion y
seguimiento (`[ ]` -> `[x]`).
