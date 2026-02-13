# 06_APPWRITE_FUNCTIONS_CATALOG.md - REAL ESTATE SAAS PLATFORM

## Referencia

- `02_backend_appwrite_requirements.md`
- `05_permissions_and_roles.md`
- `08_env_reference.md`

---

## 1. Objetivo

Definir el catalogo oficial de Appwrite Functions por instancia cliente para:

- automatizacion operativa
- seguridad backend-first
- reservas y pagos
- auditoria completa

---

## 2. Reglas Globales

1. Runtime Node.js >= 18.
2. `node-appwrite` >= 17.0.0.
3. Sin secrets hardcodeados.
4. Validacion de env obligatoria al inicio.
5. Logs estructurados con `requestId`.
6. Operaciones criticas deben registrar `activity_logs`.

---

## 3. Estructura Obligatoria

Cada function debe tener:

```text
functions/
  <function-name>/
    .env.example
    README.md
    package.json
    src/index.js
```

---

## 4. Functions MVP (Obligatorias)

## 4.1 `user-create-profile`

- Tipo: Event Trigger (`users.*.create`).
- Crea `users` y `user_preferences`.
- Default role: `client` para todos los nuevos usuarios.
- Role upgrades (owner, staff) se gestionan mediante BD por usuarios root.

## 4.2 `create-lead-public`

- Tipo: HTTP POST.
- Crea lead desde formulario publico.
- Valida propiedad publicada.
- Escribe log en `activity_logs` (`lead.create_public`).

## 4.3 `send-lead-notification`

- Tipo: Event Trigger (`databases.*.collections.leads.documents.*.create`).
- Envia email al owner/staff responsable.

## 4.3.1 `property-view-counter`

- Tipo: HTTP POST.
- Recibe `propertyId`.
- Incrementa `properties.views` para propiedad publica.
- Uso recomendado: llamada no bloqueante desde detalle publico.

## 4.4 `create-reservation-public`

- Tipo: HTTP POST autenticado.
- Crea reservacion `pending`.
- Requiere usuario `client` con email verificado.
- Valida disponibilidad minima (fechas, cupo, reglas basicas).
- Devuelve identificador de reserva y siguiente paso de pago.

## 4.4.1 `reservation-created-notification`

- Tipo: Event Trigger (`databases.*.collections.reservations.documents.*.create`).
- Notifica al owner/staff sobre nueva reservacion pendiente.
- Registra evento de notificacion en auditoria.

## 4.5 `create-payment-session`

- Tipo: HTTP POST autenticado.
- Requiere usuario `client` con email verificado.
- Genera sesion de pago con Stripe o preferencia con Mercado Pago.
- Crea/actualiza registro `reservation_payments` en `pending`.

## 4.6 `payment-webhook-stripe`

- Tipo: HTTP endpoint webhook.
- Valida firma Stripe.
- Aplica idempotencia por `providerEventId`.
- Marca pago `approved/rejected`.
- Si aprobado: confirma reservacion y dispara voucher.

## 4.7 `payment-webhook-mercadopago`

- Tipo: HTTP endpoint webhook.
- Valida origen/firma segun proveedor.
- Idempotencia y reconciliacion en `reservation_payments`.
- Confirma o rechaza reservacion segun estado real.

## 4.8 `issue-reservation-voucher`

- Tipo: HTTP interno (invocado por webhooks de pago via `Functions.createExecution`).
- Precondicion: reservacion `confirmed` y pago `approved`.
- Genera `voucherCode` unico + `reservation_vouchers`.
- Envia email con voucher al cliente.

## 4.9 `create-review-public`

- Tipo: HTTP POST autenticado.
- Requiere usuario `client` con email verificado.
- Permite reseña solo para reservaciones elegibles.
- Crea reseña en `pending`.

## 4.10 `moderate-review`

- Tipo: HTTP autenticado.
- Requiere scope `reviews.moderate`.
- Cambia estado a `published` o `rejected`.

## 4.11 `staff-user-management`

- Tipo: HTTP autenticado.
- Operaciones implementadas: `create_staff`, `list_staff`, `update_staff`, `set_staff_enabled`.
- Solo `owner` o `root`.
- Bloquea gestion de cuentas `root` y `owner`.
- Registra auditoria before/after en `activity_logs`.

## 4.12 `email-verification`

- Tipo: HTTP.
- Acciones: `send`, `resend`, `verify`.
- Sincroniza estado de verificacion en Auth + `users`.

## 4.13 `sync-user-profile`

- Tipo: HTTP autenticado.
- Sincroniza `users` con Auth (`name/email/phone`) y campos de perfil en `users` (`phoneCountryCode`, `whatsappCountryCode`, `whatsappNumber`).

## 4.14 `activity-log-query` (root-only)

- Tipo: HTTP autenticado.
- Expone consulta filtrada de `activity_logs`.
- Requiere rol `root`.
- Soporta filtros por `action`, `actorUserId`, `entityType`, `severity`, `fromDate`, `toDate`.
- Registra intentos denegados como `root_panel.access_denied`.

## 4.15 `dashboard-metrics-aggregator`

- Tipo: Cron Job diario (`55 23 * * *`, UTC).
- Calcula KPIs diarios y escribe en `analytics_daily`.
- Alimenta visualizaciones del dashboard (leads, reservas, ingresos).

## 4.16 `root-functions-diagnostics` (root-only)

- Tipo: HTTP autenticado.
- Requiere usuario autenticado con `role === root`.
- Revisa salud operativa de functions (existencia, variables runtime, ultima ejecucion).
- Permite smoke tests no destructivos para validar ejecucion en ambiente real.
- Disenada para usarse desde tab interna root del panel administrativo.

## 4.17 Permiso Execute y Scope de Actor (Definitivo)

| Function                           | Execute Appwrite | Scope de actor                                                         |
| ---------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `user-create-profile`              | `[]`             | No aplica (evento)                                                     |
| `create-lead-public`               | `any`            | No requiere auth                                                       |
| `send-lead-notification`           | `[]`             | No aplica (evento)                                                     |
| `property-view-counter`            | `any`            | No requiere auth                                                       |
| `create-reservation-public`        | `users`          | Usuario autenticado con email verificado                               |
| `reservation-created-notification` | `[]`             | No aplica (evento)                                                     |
| `create-payment-session`           | `users`          | Usuario autenticado con email verificado y reserva propia              |
| `payment-webhook-stripe`           | `any`            | No usa rol/scope; valida firma Stripe                                  |
| `payment-webhook-mercadopago`      | `any`            | No usa rol/scope; valida firma/HMAC                                    |
| `issue-reservation-voucher`        | `[]`             | No usa rol/scope; invocacion interna                                   |
| `create-review-public`             | `users`          | Usuario autenticado con email verificado y reserva elegible propia     |
| `moderate-review`                  | `users`          | `owner`/`root` o scope `reviews.moderate`                              |
| `staff-user-management`            | `users`          | `owner`/`root` o scope `staff.manage`                                  |
| `email-verification`               | `any`            | `verify` por token; `send/resend` segun validacion de payload/cooldown |
| `sync-user-profile`                | `users`          | Usuario autenticado solo sobre su propio perfil                        |
| `activity-log-query`               | `users`          | Solo `role=root`                                                       |
| `dashboard-metrics-aggregator`     | `[]`             | No aplica (cron)                                                       |
| `root-functions-diagnostics`       | `users`          | Solo `role=root`                                                       |

---

## 5. Functions Futuras (Fase 1+)

- `reservation-reminder-cron`
- `reservation-no-show-processor`
- `refund-processor`
- `seo-sitemap-generator`
- `image-processor`

---

## 6. Variables Core Minimas

Todas las functions requieren:

```bash
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=main
```

Variables adicionales por dominio:

- Leads: IDs de `properties`, `leads`, SMTP.
- Reservas/pagos: IDs de `reservations`, `reservation_payments`, claves Stripe/Mercado Pago.
- Auditoria: ID `activity_logs`.

---

## 7. Politicas de Implementacion

1. Toda function HTTP valida metodo, body y auth.
2. En webhooks, nunca confiar en datos del frontend.
3. Todas las mutaciones criticas generan log de auditoria.
4. Manejo de errores con codigos HTTP consistentes.
5. Reintentos idempotentes para webhooks.

---

## 8. Contratos de Respuesta (Base)

Estandar recomendado:

```json
{
  "success": true,
  "code": "RESERVATION_CREATED",
  "message": "Reservation created",
  "data": {}
}
```

Errores:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Missing required fields"
}
```

---

## 9. Testing Minimo por Function

- Caso exitoso.
- Caso de validacion fallida.
- Caso de permisos insuficientes.
- Caso de dependencia externa fallida.
- En webhooks: prueba de idempotencia.

---

## 10. Seguridad

- API key por function con scopes minimos.
- Nunca loguear secretos completos.
- Rate limit para endpoints publicos.
- Rotacion de llaves semestral.

---

## 11. Relacion con Otros Documentos

- `03_appwrite_db_schema.md` define colecciones usadas por estas functions.
- `05_permissions_and_roles.md` define roles/scopes que estas functions deben aplicar.
- `07_frontend_routes_and_flows.md` define como el frontend consume endpoints.

---

## 12. Estado del Documento

- Definitivo para MVP con reservas, pagos y auditoria root.
- Listo para implementacion incremental por cliente.

---

Ultima actualizacion: 2026-02-12
Version: 2.3.0
