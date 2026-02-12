# Real Estate SaaS Docs (Single-Tenant by Design)

Este directorio documenta una plataforma inmobiliaria SaaS de tipo **productized service**:

- La app de este repo es la **instancia demo/portafolio**.
- Cada cliente recibe una **instancia dedicada y aislada** (frontend + Appwrite + base de datos + storage + functions).
- **No** hay convivencia de clientes en la misma base de datos.

## Objetivo de la documentacion

1. Estandarizar como se provisiona una nueva instancia para un cliente.
2. Mantener seguridad, permisos y trazabilidad (auditoria completa).
3. Preparar reservas, pagos (Stripe/Mercado Pago), vouchers y metricas.

## Orden recomendado de lectura

1. `00_project_brief.md`
2. `01_frontend_requirements.md`
3. `02_backend_appwrite_requirements.md`
4. `03_appwrite_db_schema.md`
5. `05_permissions_and_roles.md`
6. `06_appwrite_functions_catalog.md`
7. `07_frontend_routes_and_flows.md`
8. `08_env_reference.md`
9. `10_master_plan_checklist.md`
10. `11_schema_mapping_matrix.md`
11. `12_env_traceability_matrix.md`

## Flujos clave del producto

- Catalogo publico por cliente.
- Contacto y mensajeria de leads.
- Reservas por propiedad con estado y disponibilidad.
- Pagos online (Stripe/Mercado Pago) con webhooks.
- Emision de voucher de reservacion.
- Reviews post-estadia.
- Dashboard con estadisticas.
- Panel oculto root para auditoria (`ActivityLog`).

## Provisioning por cliente (resumen)

1. Clonar plantilla de frontend.
2. Crear proyecto Appwrite dedicado.
3. Crear `database main`, colecciones e indices.
4. Crear buckets y functions.
5. Configurar variables `.env` de instancia.
6. Crear usuario `owner` del cliente.
7. Crear usuario `root` interno (no visible en UI publica).
8. Ejecutar smoke test de reservas, pagos y logs.

## Criterio no negociable

Todo cambio funcional debe mantener consistencia entre:

- Requerimientos (`02`)
- Esquema (`03`)
- Permisos (`05`)
- Functions (`06`)
- Rutas/UX (`07`)
- Variables (`08`)

---

Ultima actualizacion: 2026-02-12
Version: 2.1.0
