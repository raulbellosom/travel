# 12_ENV_TRACEABILITY_MATRIX - RESOURCE + MODULES

## Proposito

Trazabilidad de variables de entorno para arquitectura v3.

---

## Matriz principal

| ENV                                              | Archivo(s) principal(es)                                                                                                        | Uso                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `APPWRITE_ENDPOINT`                              | `src/env.js`, `src/api/appwriteClient.js`, `functions/*/src/index.js`                                                           | cliente Appwrite                              |
| `APPWRITE_PROJECT_ID`                            | `src/env.js`, `src/api/appwriteClient.js`, `functions/*/src/index.js`                                                           | proyecto                                      |
| `APPWRITE_DATABASE_ID`                           | `src/env.js`, `src/services/*.js`, `functions/*/src/index.js`                                                                   | DB `main`                                     |
| `APPWRITE_COLLECTION_RESOURCES_ID`               | `src/env.js`, `src/services/resourcesService.js`, `functions/create-*/src/index.js`, `functions/deep-search-query/src/index.js` | coleccion canonica de catalogo                |
| `APPWRITE_COLLECTION_RATE_PLANS_ID`              | `src/env.js`, `src/services/resourcesService.js`, `functions/*`                                                                 | pricing avanzado                              |
| `APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID`       | `src/env.js`, `src/services/instanceSettingsService.js`, `functions/*/src/lib/modulesService.js`                                | plan/modulos/limites                          |
| `APPWRITE_COLLECTION_LEADS_ID`                   | `src/env.js`, `src/services/leadsService.js`, `functions/create-lead/src/index.js`                                              | leads                                         |
| `APPWRITE_COLLECTION_MARKETING_CONTACT_REQUESTS_ID` | `src/env.js`, `functions/create-marketing-contact-public/src/index.js`                                                       | contactos landing marketing                   |
| `APPWRITE_COLLECTION_MARKETING_NEWSLETTER_SUBSCRIBERS_ID` | `src/env.js`, `functions/create-newsletter-subscription-public/src/index.js`                                           | suscriptores landing marketing                |
| `APPWRITE_COLLECTION_RESERVATIONS_ID`            | `src/env.js`, `src/services/reservationsService.js`, `functions/create-reservation-public/src/index.js`                         | reservas                                      |
| `APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID`    | `src/env.js`, `functions/create-payment-session/src/index.js`, `functions/payment-webhook-*/src/index.js`                       | pagos                                         |
| `APPWRITE_COLLECTION_RESERVATION_VOUCHERS_ID`    | `src/env.js`, `functions/issue-reservation-voucher/src/index.js`                                                                | vouchers                                      |
| `APPWRITE_COLLECTION_REVIEWS_ID`                 | `src/env.js`, `src/services/reviewsService.js`, `functions/create-review-public/src/index.js`                                   | reviews                                       |
| `APPWRITE_COLLECTION_CONVERSATIONS_ID`           | `src/env.js`, `src/services/chatService.js`, `functions/send-chat-notification/src/index.js`                                    | chat threads                                  |
| `APPWRITE_COLLECTION_MESSAGES_ID`                | `src/env.js`, `src/services/chatService.js`                                                                                     | mensajes                                      |
| `APPWRITE_COLLECTION_FAVORITES_ID`               | `src/env.js`, `src/services/favoritesService.js`, `src/pages/PropertyDetail.jsx`, `src/pages/MyFavorites.jsx`                   | favoritos de usuario                          |
| `APPWRITE_COLLECTION_PASSWORD_RESETS_ID`         | `functions/send-password-reset/src/index.js`                                                                                    | tokens de reset de contrasena via SMTP propio |
| `APPWRITE_COLLECTION_ACTIVITY_LOGS_ID`           | `src/env.js`, `src/services/activityLogsService.js`, `functions/*/src/index.js`                                                 | auditoria                                     |
| `APPWRITE_COLLECTION_ANALYTICS_DAILY_ID`         | `src/env.js`, `functions/dashboard-metrics-aggregator/src/index.js`                                                             | KPIs                                          |
| `APPWRITE_COLLECTION_USERS_ID`                   | `src/env.js`, `functions/staff-user-management/src/index.js`                                                                    | usuarios y roles                              |
| `APPWRITE_FUNCTION_CREATE_LEAD_ID`               | `src/env.js`, `src/services/leadsService.js`                                                                                    | ejecucion function lead                       |
| `APPWRITE_FUNCTION_CREATE_RESERVATION_ID`        | `src/env.js`, `src/services/reservationsService.js`                                                                             | ejecucion function reservation                |
| `APPWRITE_FUNCTION_CREATE_MANUAL_RESERVATION_ID` | `src/env.js`, `src/services/reservationsService.js`, `functions/create-reservation-manual/src/index.js`                        | reserva manual (sin checkout online)          |
| `APPWRITE_FUNCTION_GET_RESOURCE_AVAILABILITY_ID` | `src/env.js`, `src/services/reservationsService.js`, `src/pages/PropertyDetail.jsx`, `functions/get-resource-availability/src/index.js` | disponibilidad para calendario y agenda       |
| `APPWRITE_FUNCTION_CREATE_PAYMENT_SESSION_ID`    | `src/env.js`, `src/services/reservationsService.js`                                                                             | checkout                                      |
| `APPWRITE_FUNCTION_EXPIRE_PENDING_RESERVATIONS_ID` | `src/env.js`                                                                                                                    | scheduler de expiracion de holds              |
| `APPWRITE_FUNCTION_CREATE_MARKETING_CONTACT_ID`  | `src/env.js`, `src/services/marketingService.js`                                                                                | submit de contacto publico marketing          |
| `APPWRITE_FUNCTION_CREATE_NEWSLETTER_SUBSCRIPTION_ID` | `src/env.js`, `src/services/marketingService.js`                                                                            | alta newsletter publica marketing (ID real: `create-newsletter-subscription-publi`) |
| `APPWRITE_FUNCTION_STRIPE_CREATE_CONNECTED_ACCOUNT_ID` | `src/env.js`                                                                                                                | onboarding connect                            |
| `APPWRITE_FUNCTION_STRIPE_CREATE_ACCOUNT_LINK_ID` | `src/env.js`                                                                                                                    | onboarding connect                            |
| `APPWRITE_FUNCTION_STRIPE_REFRESH_ACCOUNT_LINK_ID` | `src/env.js`                                                                                                                   | onboarding connect                            |
| `APPWRITE_FUNCTION_STRIPE_GET_ACCOUNT_STATUS_ID` | `src/env.js`                                                                                                                     | estado capabilities connect                   |
| `APPWRITE_FUNCTION_SEND_CHAT_NOTIFICATION_ID`    | `src/env.js`, `src/services/chatService.js`                                                                                     | notificacion chat offline                     |
| `APPWRITE_FUNCTION_SEND_PROPOSAL_ID`             | `src/env.js`, `src/services/chatService.js`, `src/contexts/ChatContext.jsx`                                                    | mensaje accionable de propuesta (interno)     |
| `APPWRITE_FUNCTION_RESPOND_PROPOSAL_ID`          | `src/env.js`, `src/services/chatService.js`, `src/contexts/ChatContext.jsx`                                                    | respuesta accionable de propuesta (cliente)   |
| `APPWRITE_FUNCTION_SEND_PASSWORD_RESET_ID`       | `src/env.js`, `src/services/authService.js`, `src/pages/ResetPassword.jsx`                                                      | reset de contrasena via SMTP propio           |
| `APPWRITE_API_KEY` / `APPWRITE_FUNCTION_API_KEY` | `functions/*/src/index.js`                                                                                                      | server-side credentials                       |
| `STRIPE_SECRET_KEY`                              | `functions/create-payment-session/src/index.js`                                                                                 | stripe checkout                               |
| `STRIPE_PLATFORM_FEE_PERCENT` / `STRIPE_PLATFORM_FEE_FIXED` | `functions/create-payment-session/src/index.js`                                                                    | fee de plataforma (destination charge)        |
| `STRIPE_WEBHOOK_SECRET`                          | `functions/payment-webhook-stripe/src/index.js`                                                                                 | validacion webhook                            |
| `MERCADOPAGO_ACCESS_TOKEN`                       | `functions/create-payment-session/src/index.js`                                                                                 | MP checkout                                   |
| `MERCADOPAGO_WEBHOOK_SECRET`                     | `functions/payment-webhook-mercadopago/src/index.js`                                                                            | validacion webhook                            |
| `PAYMENT_DEFAULT_PROVIDER`                       | `functions/create-payment-session/src/index.js`                                                                                 | proveedor por defecto                         |
| `PAYMENT_SUCCESS_URL` / `PAYMENT_CANCEL_URL`     | `functions/create-payment-session/src/index.js`                                                                                 | redirects post pago                           |
| `APP_BASE_URL`                                   | `src/env.js`, `functions/*`                                                                                                     | enlaces publicos                              |
| `FEATURE_MARKETING_SITE`                         | `src/env.js`, `src/utils/uiMode.js`, `.env.example`                                                                            | fallback local para UI mode si falla `instance_settings` |

---

## Notas operativas

- `APPWRITE_COLLECTION_RESOURCES_ID` es obligatorio en todos los despliegues activos.
- `APPWRITE_COLLECTION_RESOURCE_IMAGES_ID`, `APPWRITE_COLLECTION_RATE_PLANS_ID` y `APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID` deben estar definidos para arquitectura completa.
- `APPWRITE_COLLECTION_MARKETING_CONTACT_REQUESTS_ID` y `APPWRITE_COLLECTION_MARKETING_NEWSLETTER_SUBSCRIBERS_ID` deben estar definidos para separar marketing de plataforma.
- `APPWRITE_COLLECTION_FAVORITES_ID` debe definirse si se habilita lista de favoritos en cliente.
- `APPWRITE_COLLECTION_PASSWORD_RESETS_ID` debe definirse para el flujo de reset de contrasena. Solo accedido desde la funcion server-side `send-password-reset`.
- `APPWRITE_FUNCTION_CREATE_MANUAL_RESERVATION_ID` y `APPWRITE_FUNCTION_GET_RESOURCE_AVAILABILITY_ID` deben definirse para flujos de reserva manual y calendario de disponibilidad.
- `APPWRITE_FUNCTION_SEND_PROPOSAL_ID` y `APPWRITE_FUNCTION_RESPOND_PROPOSAL_ID` deben definirse para chat accionable en plataforma.
- `FEATURE_MARKETING_SITE` no es source of truth primario; solo fallback cuando `instance_settings` no esta disponible.
- Recordatorio: IDs de Appwrite Functions tienen limite de 36 caracteres; cuando el nombre funcional lo exceda, el `APPWRITE_FUNCTION_*_ID` debe usar la version truncada real.
- `.env.example` y `functions/*/.env.example` deben mantenerse sincronizados con esta matriz.

---

Ultima actualizacion: 2026-03-01
Version: 2.3.2
