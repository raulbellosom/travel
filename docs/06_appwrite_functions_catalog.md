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
- Default role: `owner` solo para bootstrap inicial; staff via invitacion.

## 4.2 `create-lead-public`

- Tipo: HTTP POST.
- Crea lead desde formulario publico.
- Valida propiedad publicada.
- Escribe log en `activity_logs` (`lead.create_public`).

## 4.3 `send-lead-notification`

- Tipo: Event Trigger (`leads.create`).
- Envia email al owner/staff responsable.

## 4.4 `create-reservation-public`

- Tipo: HTTP POST.
- Crea reservacion `pending`.
- Valida disponibilidad minima (fechas, cupo, reglas basicas).
- Devuelve identificador de reserva y siguiente paso de pago.

## 4.4.1 `reservation-created-notification`

- Tipo: Event Trigger (`reservations.create`).
- Notifica al owner/staff sobre nueva reservacion pendiente.
- Registra evento de notificacion en auditoria.

## 4.5 `create-payment-session`

- Tipo: HTTP POST autenticado/publico controlado.
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

- Tipo: Event Trigger o HTTP interno.
- Precondicion: reservacion `confirmed` y pago `approved`.
- Genera `voucherCode` unico + `reservation_vouchers`.
- Envia email con voucher al cliente.

## 4.9 `create-review-public`

- Tipo: HTTP POST.
- Permite reseña solo para reservaciones elegibles.
- Crea reseña en `pending`.

## 4.10 `moderate-review`

- Tipo: HTTP autenticado.
- Requiere scope `reviews.moderate`.
- Cambia estado a `published` o `rejected`.

## 4.11 `staff-user-management`

- Tipo: HTTP autenticado.
- Operaciones: crear staff, cambiar role/scopes, desactivar staff.
- Solo `owner` o `root`.
- Registra auditoria before/after.

## 4.12 `email-verification`

- Tipo: HTTP.
- Acciones: `send`, `resend`, `verify`.
- Sincroniza estado de verificacion en Auth + `users`.

## 4.13 `sync-user-profile`

- Tipo: HTTP autenticado.
- Sincroniza `users` con Auth (`name/email/phone`).

## 4.14 `activity-log-query` (root-only)

- Tipo: HTTP autenticado.
- Expone consulta filtrada de `activity_logs`.
- Requiere rol `root`.

## 4.15 `dashboard-metrics-aggregator`

- Tipo: Cron Job (diario) o endpoint interno.
- Calcula KPIs diarios y escribe en `analytics_daily`.
- Alimenta visualizaciones del dashboard (leads, reservas, ingresos).

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

Ultima actualizacion: 2026-02-10
Version: 2.0.0
