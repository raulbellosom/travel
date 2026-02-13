# 08_ENV_REFERENCE.md - REAL ESTATE SAAS PLATFORM

## Referencia

- `01_frontend_requirements.md`
- `02_backend_appwrite_requirements.md`
- `06_appwrite_functions_catalog.md`

---

## 1. Principios

1. Single source of truth: toda variable debe definirse aqui.
2. Una configuracion por instancia cliente.
3. Nomenclatura unificada `APP_*` y `APPWRITE_*` para frontend y functions.
4. Frontend lee estas llaves via `vite.config.js` (`globalThis.__TRAVEL_ENV__`).
5. No duplicar con `VITE_*` como canon (solo compatibilidad legacy).

---

## 2. Variables Core de Instancia

```bash
APP_NAME="Real Estate SaaS"
APP_ENV=development
APP_BASE_URL=http://localhost:5173
APP_VERSION=1.0.0
```

---

## 3. Appwrite Compartido (public ids / no secrets)

```bash
APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
APPWRITE_PROJECT_ID=
APPWRITE_DATABASE_ID=main

APPWRITE_COLLECTION_USERS_ID=users
APPWRITE_COLLECTION_USER_PREFERENCES_ID=user_preferences
APPWRITE_COLLECTION_PROPERTIES_ID=properties
APPWRITE_COLLECTION_PROPERTY_IMAGES_ID=property_images
APPWRITE_COLLECTION_AMENITIES_ID=amenities
APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID=property_amenities
APPWRITE_COLLECTION_LEADS_ID=leads
APPWRITE_COLLECTION_RESERVATIONS_ID=reservations
APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID=reservation_payments
APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID=reservation_vouchers
APPWRITE_COLLECTION_REVIEWS_ID=reviews
APPWRITE_COLLECTION_ANALYTICS_DAILY_ID=analytics_daily
APPWRITE_COLLECTION_ACTIVITY_LOGS_ID=activity_logs
APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID=email_verifications

APPWRITE_BUCKET_PROPERTY_IMAGES_ID=property-images
APPWRITE_BUCKET_AVATARS_ID=avatars
APPWRITE_BUCKET_DOCUMENTS_ID=documents
```

---

## 4. Function IDs (frontend + orchestration)

```bash
APPWRITE_FUNCTION_CREATE_LEAD_ID=create-lead-public
APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID=email-verification
APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID=sync-user-profile
APPWRITE_FUNCTION_USER_CREATE_PROFILE_ID=user-create-profile
APPWRITE_FUNCTION_SEND_LEAD_NOTIFICATION_ID=send-lead-notification
APPWRITE_FUNCTION_PROPERTY_VIEW_COUNTER_ID=property-view-counter
APPWRITE_FUNCTION_CREATE_RESERVATION_ID=create-reservation-public
APPWRITE_FUNCTION_RESERVATION_CREATED_NOTIFICATION_ID=reservation-created-notification
APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID=create-payment-session
APPWRITE_FUNCTION_PAYMENT_WEBHOOK_STRIPE_ID=payment-webhook-stripe
APPWRITE_FUNCTION_PAYMENT_WEBHOOK_MERCADOPAGO_ID=payment-webhook-mercadopago
APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID=issue-reservation-voucher
APPWRITE_FUNCTION_CREATE_REVIEW_ID=create-review-public
APPWRITE_FUNCTION_MODERATE_REVIEW_ID=moderate-review
APPWRITE_FUNCTION_DASHBOARD_METRICS_ID=dashboard-metrics-aggregator
APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID=staff-user-management
APPWRITE_FUNCTION_ACTIVITY_LOG_QUERY_ID=activity-log-query
APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID=root-functions-diagnostics
```

---

## 5. Function Runtime (server-only secrets)

```bash
APPWRITE_API_KEY=
APPWRITE_FUNCTION_ENDPOINT=
APPWRITE_FUNCTION_PROJECT_ID=
APPWRITE_FUNCTION_API_KEY=
```

---

## 6. Email y Notificaciones

```bash
EMAIL_VERIFICATION_TTL_MINUTES=120
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=180

EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM_NAME="Real Estate SaaS"
EMAIL_FROM_ADDRESS=
```

---

## 7. Pagos

```bash
PAYMENT_DEFAULT_PROVIDER=stripe
PAYMENT_SUCCESS_URL=
PAYMENT_CANCEL_URL=

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
```

---

## 8. Features y APIs Externas

```bash
FEATURE_GEOLOCATION=true
FEATURE_DARK_MODE=true
FEATURE_I18N=true
FEATURE_VERBOSE_LOGS=false

GOOGLE_MAPS_API_KEY=
MAPBOX_ACCESS_TOKEN=
GA_MEASUREMENT_ID=
```

---

## 9. Validacion Recomendada

### 9.1 Frontend (`src/env.js`)

```javascript
const required = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_COLLECTION_USERS_ID",
  "APPWRITE_COLLECTION_PROPERTIES_ID",
  "APPWRITE_COLLECTION_LEADS_ID",
  "APPWRITE_COLLECTION_RESERVATIONS_ID",
  "APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID",
  "APPWRITE_COLLECTION_REVIEWS_ID",
];
```

### 9.2 Functions

```javascript
validateEnv([
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
]);
```

---

## 10. Seguridad

Nunca commitear:

- `.env`
- `.env.local`
- `.env.production`

Siempre commitear:

- `.env.example` sin valores reales.

Buenas practicas:

- API key por function.
- Scope minimo por function.
- Rotacion de secrets cada 6 meses.
- No exponer llaves de pago en frontend.

---

## 11. Relacion con Archivos del Repo

- `vite.config.js`: publica solo llaves permitidas a frontend.
- `src/env.js`: contrato runtime del frontend.
- `.env.example`: plantilla oficial de instancia.
- `functions/*/.env.example`: contratos por function.

---

## 12. Estado del Documento

- Definitivo para nomenclatura unificada de variables.
- Alineado con el catalogo de functions y esquema Appwrite actual.
- Eliminadas variables obsoletas de instance/owner (se gestionan vía BD).

---

Ultima actualizacion: 2026-02-12
Version: 2.2.0
