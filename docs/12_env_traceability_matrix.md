# 12_ENV_TRACEABILITY_MATRIX.md - ENV -> Archivo -> Modulo

## Proposito

Trazar cada variable critica a su punto de consumo para reducir fallos por
misconfiguracion entre frontend, functions y despliegue.

---

## Matriz core

| ENV | Archivo(s) principal(es) | Modulo / Uso |
| --- | ------------------------ | ------------ |
| `APP_BASE_URL` | `src/env.js`, `functions/issue-reservation-voucher/src/index.js` | URL base publica para links (voucher/PWA) |
| `APPWRITE_ENDPOINT` | `src/env.js`, `src/api/appwriteClient.js`, `functions/*/src/index.js` | Cliente Appwrite frontend/functions |
| `APPWRITE_PROJECT_ID` | `src/env.js`, `src/api/appwriteClient.js`, `functions/*/src/index.js` | Proyecto Appwrite |
| `APPWRITE_DATABASE_ID` | `src/env.js`, `src/services/*.js`, `functions/*/src/index.js` | Base `main` |
| `APPWRITE_COLLECTION_USERS_ID` | `src/env.js`, `functions/staff-user-management/src/index.js`, `functions/activity-log-query/src/index.js` | Perfiles/roles |
| `APPWRITE_COLLECTION_PROPERTIES_ID` | `src/env.js`, `src/services/propertiesService.js`, `functions/create-lead-public/src/index.js` | Catalogo de propiedades |
| `APPWRITE_COLLECTION_LEADS_ID` | `src/env.js`, `src/services/leadsService.js`, `functions/create-lead-public/src/index.js` | Leads comerciales |
| `APPWRITE_COLLECTION_RESERVATIONS_ID` | `src/env.js`, `src/services/reservationsService.js`, `functions/create-reservation-public/src/index.js`, `functions/payment-webhook-*/src/index.js` | Reservas |
| `APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID` | `src/env.js`, `src/services/paymentsService.js`, `functions/create-payment-session/src/index.js`, `functions/payment-webhook-*/src/index.js` | Pagos |
| `APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID` | `src/env.js`, `functions/issue-reservation-voucher/src/index.js` | Vouchers |
| `APPWRITE_COLLECTION_REVIEWS_ID` | `src/env.js`, `src/services/reviewsService.js`, `functions/create-review-public/src/index.js`, `functions/moderate-review/src/index.js` | Reseñas |
| `APPWRITE_COLLECTION_ANALYTICS_DAILY_ID` | `src/env.js`, `functions/dashboard-metrics-aggregator/src/index.js` | KPIs diarios |
| `APPWRITE_COLLECTION_ACTIVITY_LOGS_ID` | `src/env.js`, `src/services/activityLogsService.js`, `functions/*/src/index.js` | Auditoria forense |
| `APPWRITE_FUNCTION_CREATE_LEAD_ID` | `src/env.js`, `src/services/leadsService.js` | Alta de lead publico |
| `APPWRITE_FUNCTION_CREATE_RESERVATION_ID` | `src/env.js`, `src/services/reservationsService.js` | Crear reserva publica |
| `APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID` | `src/env.js`, `src/services/reservationsService.js` | Iniciar checkout |
| `APPWRITE_FUNCTION_CREATE_REVIEW_ID` | `src/env.js`, `src/services/reviewsService.js` | Crear reseña publica |
| `APPWRITE_FUNCTION_MODERATE_REVIEW_ID` | `src/env.js`, `src/services/reviewsService.js` | Moderación de reseñas |
| `APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID` | `src/env.js`, `src/services/staffService.js` | Alta/gestion staff |
| `APPWRITE_FUNCTION_ACTIVITY_LOG_QUERY_ID` | `src/env.js`, `src/services/activityLogsService.js` | Consulta root activity logs |
| `APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID` | `.env.example`, `functions/payment-webhook-*/src/index.js` | Emision de voucher tras pago aprobado |
| `APPWRITE_API_KEY` / `APPWRITE_FUNCTION_API_KEY` | `functions/*/src/index.js` | Credenciales server-side |
| `STRIPE_SECRET_KEY` | `functions/create-payment-session/src/index.js` | Sesion de pago Stripe |
| `STRIPE_WEBHOOK_SECRET` | `functions/payment-webhook-stripe/src/index.js` | Firma webhook Stripe |
| `MERCADOPAGO_ACCESS_TOKEN` | `functions/create-payment-session/src/index.js` | Checkout Mercado Pago |
| `MERCADOPAGO_WEBHOOK_SECRET` | `functions/payment-webhook-mercadopago/src/index.js` | Firma webhook MP |
| `PAYMENT_DEFAULT_PROVIDER` | `functions/create-payment-session/src/index.js` | Fallback de proveedor |
| `PAYMENT_SUCCESS_URL` / `PAYMENT_CANCEL_URL` | `functions/create-payment-session/src/index.js` | Redirect post pago |

---

## Notas de control

- Fuente de verdad de nombres: `docs/08_env_reference.md`.
- Este documento no reemplaza `.env.example`; lo complementa para auditoria.
- Si se agrega una nueva function o coleccion, se actualiza esta matriz en el mismo PR.

---

Ultima actualizacion: 2026-02-12
Version: 1.0.0
