# dashboard-metrics-aggregator

Materializes daily KPIs in `analytics_daily`.

## Contrato de ejecucion

- Tipo: Cron Job.
- Trigger Appwrite: `schedule = 55 23 * * *` (UTC, diario).
- Metodo HTTP: no aplica para operacion normal.
- Permiso `execute`: `[]`.
- Scope/rol de actor: no requiere usuario autenticado.

## Scopes minimos de API key

- `databases.read`
- `databases.write`

## KPI calculados

- `resourcesPublished`
- `leadsCreated`
- `reservationsCreated`
- `paymentsApproved`
- `grossRevenue`

