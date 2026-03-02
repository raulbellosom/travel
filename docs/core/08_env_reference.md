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
6. IDs de Appwrite Functions tienen limite maximo de 36 caracteres.

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
APPWRITE_COLLECTION_RESOURCES_ID=resources
APPWRITE_COLLECTION_RESOURCE_IMAGES_ID=resource_images
APPWRITE_COLLECTION_RATE_PLANS_ID=rate_plans
APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID=instance_settings
APPWRITE_COLLECTION_AMENITIES_ID=amenities
APPWRITE_COLLECTION_LEADS_ID=leads
APPWRITE_COLLECTION_MARKETING_CONTACT_REQUESTS_ID=marketing_contact_requests
APPWRITE_COLLECTION_MARKETING_NEWSLETTER_SUBSCRIBERS_ID=marketing_newsletter_subscribers
APPWRITE_COLLECTION_RESERVATIONS_ID=reservations
APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID=reservation_payments
APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID=reservation_vouchers
APPWRITE_COLLECTION_REVIEWS_ID=reviews
APPWRITE_COLLECTION_ANALYTICS_DAILY_ID=analytics_daily
APPWRITE_COLLECTION_ACTIVITY_LOGS_ID=activity_logs
APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID=email_verifications
APPWRITE_COLLECTION_CONVERSATIONS_ID=conversations
APPWRITE_COLLECTION_MESSAGES_ID=messages
APPWRITE_COLLECTION_FAVORITES_ID=favorites
APPWRITE_COLLECTION_PASSWORD_RESETS_ID=password_resets

APPWRITE_BUCKET_RESOURCE_IMAGES_ID=resource-images
APPWRITE_BUCKET_AVATARS_ID=avatars
APPWRITE_BUCKET_DOCUMENTS_ID=documents
```

---

## 4. Function IDs (frontend + orchestration)

```bash
APPWRITE_FUNCTION_CREATE_LEAD_ID=create-lead
APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID=email-verification
APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID=sync-user-profile
APPWRITE_FUNCTION_USER_CREATE_PROFILE_ID=user-create-profile
APPWRITE_FUNCTION_SEND_LEAD_NOTIFICATION_ID=send-lead-notification
APPWRITE_FUNCTION_PROPERTY_VIEW_COUNTER_ID=property-view-counter
APPWRITE_FUNCTION_CREATE_RESERVATION_ID=create-reservation-public
APPWRITE_FUNCTION_CREATE_MANUAL_RESERVATION_ID=create-reservation-manual
APPWRITE_FUNCTION_GET_RESOURCE_AVAILABILITY_ID=get-resource-availability
APPWRITE_FUNCTION_RESERVATION_CREATED_NOTIFICATION_ID=reservation-created-notification
APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID=create-payment-session
APPWRITE_FUNCTION_EXPIRE_PENDING_RESERVATIONS_ID=expire-pending-reservations
APPWRITE_FUNCTION_PAYMENT_WEBHOOK_STRIPE_ID=payment-webhook-stripe
APPWRITE_FUNCTION_PAYMENT_WEBHOOK_MERCADOPAGO_ID=payment-webhook-mercadopago
APPWRITE_FUNCTION_ISSUE_RESERVATION_VOUCHER_ID=issue-reservation-voucher
APPWRITE_FUNCTION_CREATE_REVIEW_ID=create-review-public
APPWRITE_FUNCTION_CREATE_MARKETING_CONTACT_ID=create-marketing-contact-public
APPWRITE_FUNCTION_CREATE_NEWSLETTER_SUBSCRIPTION_ID=create-newsletter-subscription-publi
APPWRITE_FUNCTION_MODERATE_REVIEW_ID=moderate-review
APPWRITE_FUNCTION_DASHBOARD_METRICS_ID=dashboard-metrics-aggregator
APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID=staff-user-management
APPWRITE_FUNCTION_ACTIVITY_LOG_QUERY_ID=activity-log-query
APPWRITE_FUNCTION_ROOT_DIAGNOSTICS_ID=root-functions-diagnostics
APPWRITE_FUNCTION_DEEP_SEARCH_QUERY_ID=deep-search-query
APPWRITE_FUNCTION_SEND_CHAT_NOTIFICATION_ID=send-chat-notification
APPWRITE_FUNCTION_SEND_PROPOSAL_ID=send-proposal
APPWRITE_FUNCTION_RESPOND_PROPOSAL_ID=respond-proposal
APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID=send-password-reset
APPWRITE_FUNCTION_STRIPE_CREATE_CONNECTED_ACCOUNT_ID=stripe-create-connected-account
APPWRITE_FUNCTION_STRIPE_CREATE_ACCOUNT_LINK_ID=stripe-create-account-link
APPWRITE_FUNCTION_STRIPE_REFRESH_ACCOUNT_LINK_ID=stripe-refresh-account-link
APPWRITE_FUNCTION_STRIPE_GET_ACCOUNT_STATUS_ID=stripe-get-account-status
```

Nota importante (Name vs ID en Appwrite Functions):

- `name` visible de function puede ser mas largo (ejemplo: `create-newsletter-subscription-public`).
- `functionId` real usado por ENV/SDK debe respetar maximo 36 caracteres.
- Por eso en ENV se usa `create-newsletter-subscription-publi`.

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

PASSWORD_RESET_TTL_MINUTES=60
PASSWORD_RESET_COOLDOWN_SECONDS=60

EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM_NAME="Real Estate SaaS"
EMAIL_FROM_ADDRESS=
PLATFORM_OWNER_EMAIL=admin@yourdomain.com
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
STRIPE_PLATFORM_FEE_PERCENT=10
STRIPE_PLATFORM_FEE_FIXED=0

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
FEATURE_MARKETING_SITE=true

GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_MAP_ID=
GA_MEASUREMENT_ID=
```

| Variable                 | Descripción                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `FEATURE_GEOLOCATION`    | Habilita geolocalización en el mapa                                                      |
| `FEATURE_DARK_MODE`      | Habilita selector de tema oscuro                                                         |
| `FEATURE_I18N`           | Habilita selector de idioma                                                              |
| `FEATURE_VERBOSE_LOGS`   | Activa logs detallados en consola                                                        |
| `FEATURE_MARKETING_SITE` | Fallback local de UI mode cuando `instance_settings` no esta disponible: `true` = landing CRM en `/`; `false` = catálogo de recursos en `/`. |

---

## 9. Validacion Recomendada

### 9.1 Frontend (`src/env.js`)

```javascript
const required = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_COLLECTION_USERS_ID",
  "APPWRITE_COLLECTION_RESOURCES_ID",
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
- Restringir `GOOGLE_MAPS_API_KEY` por dominios permitidos (HTTP referrers).
- Restringir `GOOGLE_MAPS_API_KEY` solo a Maps JavaScript API, Places API y Geocoding API.

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
- Agregadas variables de chat (`conversations`, `messages`, `send-chat-notification`, `send-proposal`, `respond-proposal`, `PLATFORM_OWNER_EMAIL`).
- Agregadas variables de colecciones de marketing separadas (`marketing_contact_requests`, `marketing_newsletter_subscribers`) sin aliases legacy.
- Agregada function `deep-search-query`.
- Agregada variable de coleccion de favoritos: `APPWRITE_COLLECTION_FAVORITES_ID`.
- Agregadas functions de reserva manual y disponibilidad: `APPWRITE_FUNCTION_CREATE_MANUAL_RESERVATION_ID`, `APPWRITE_FUNCTION_GET_RESOURCE_AVAILABILITY_ID`.

---

Ultima actualizacion: 2026-03-01
Version: 2.5.2
