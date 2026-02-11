# dashboard-metrics-aggregator

Cron/internal function that materializes daily KPIs into `analytics_daily`.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Type

- Cron job or internal HTTP endpoint

## Security

- Request parsing/method checks are handled by local util `src/_request.js`.
- No global shared middleware across function folders.
- `actorUserId` for audit is taken from runtime request headers when available.

## Payload (optional)

```json
{
  "metricDate": "2026-02-11"
}
```

If omitted, it aggregates the current UTC day.

## KPIs

- `propertiesPublished`
- `leadsCreated`
- `reservationsCreated`
- `paymentsApproved`
- `grossRevenue`

## Environment

See `.env.example`.
