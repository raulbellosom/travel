# CODEX AGENT SPEC — Leads autenticados + Chat + Reservas completas + Stripe Connect (Eliminar flujos públicos)

Proyecto: INMOBO Resource Platform (Appwrite backend)  
Idioma: Español (UTF-8, con acentos y ñ)  
Regla clave: No existe contacto público. Para pedir información/cotización o chatear, el usuario debe estar autenticado.

---

## 0) Objetivo

1) Eliminar por completo el concepto de **lead público** y cualquier endpoint/UI/Function “public” para leads.  
2) Redefinir **Lead** como: “un usuario autenticado preguntó/cotizó por un recurso”.  
3) Hacer que el **Chat** sea el canal vivo vinculado al Lead.  
4) Dejar el sistema de **reservas** (date_range / time_slot / fixed_event) implementado de manera confiable (evitar double-booking, holds, expiración).  
5) Integrar **pagos online** con **Stripe Connect** (mínimo viable), y documentar qué se requiere para operar.

---

## 1) Estado actual (referencias internas del repo)

- Schema DB: `03_appwrite_db_schema.md`
  - `leads` hoy está descrito como “mensajes de contacto del sitio público” con campos `name/email/phone/message`.
  - `reservations` ya existe con `status` (`pending/confirmed/cancelled/completed/expired`) y `paymentStatus`.
  - `reservation_payments` ya existe para webhooks e idempotencia.
- Catálogo de functions: `06_appwrite_functions_catalog.md`
  - Existe `create-lead-public` y `send-lead-notification`.
  - `create-reservation-public` está marcado como autenticado.
  - `create-payment-session` y `payment-webhook-stripe` existen.
- Roles y permisos: `05_permissions_and_roles.md`
  - Hoy dice: leads create = `create-lead-public`.

IMPORTANTE: Este cambio es una “Opción B”: eliminar lo público.

---

## 2) Cambios requeridos (alto nivel)

### 2.1 Eliminar leads públicos
- Eliminar Function `create-lead-public` (código, deployment, rutas, docs).
- Eliminar cualquier uso en frontend (botones “Solicitar información” para invitados, formularios públicos por recurso, etc.).
- Actualizar `05_permissions_and_roles.md` para que la creación de lead sea autenticada.
- Si existe un trigger asociado a creación pública de lead, re-ajustarlo a los nuevos leads autenticados (sección 3).

### 2.2 Redefinir Lead (autenticado)
Lead = registro CRM/pipeline de una intención del usuario autenticado.

Chat = conversación (conversations/messages) asociada al lead (preferentemente 1 lead ↔ 1 conversation por resource+user mientras el lead esté abierto).

### 2.3 Reservas “confiables” (anti double-booking)
- Implementar lógica de solapamiento (overlap) en backend (Function) como fuente de verdad.
- Implementar “hold” (pending) con expiración.
- Implementar expiración automática de holds.

### 2.4 Stripe Connect (mínimo viable)
- Conectar pagos: crear sesión/intent y confirmar por webhook.
- Conectar “owners/proveedores” como **connected accounts**.
- Cobro tipo **destination charge** con comisión de la plataforma (application_fee_amount) y transferencia al owner.

---

## 3) Diseño de datos (Appwrite Collections)

### 3.1 Colección `leads` — modificar a Lead autenticado

Actualmente `leads` tiene campos orientados a público (name/email/phone). Debe transformarse a un lead autenticado.

Acciones:
1) **Modificar** la colección `leads` en Appwrite (migración manual o script de setup).
2) **Actualizar** documentación en `03_appwrite_db_schema.md`.

#### Nuevo contrato sugerido de `leads` (propuesto)

Mantén `resourceId` y `resourceOwnerUserId`. Agrega `userId` y normaliza el mensaje.

**Campos a mantener**
- `resourceId` (string, required)
- `resourceOwnerUserId` (string, required, denormalizado)
- `status` (enum: `new/contacted/closed_won/closed_lost`)
- `notes` (string, interno)
- `enabled` (boolean)

**Campos a agregar**
- `userId` (string, required) — FK logical `users.$id` del cliente que pregunta
- `lastMessage` (string, required) — texto inicial de cotización/pregunta (o el resumen)
- `conversationId` (string, no requerido) — FK logical `conversations.$id` si se abre chat
- `source` (enum, no requerido, default `authenticated_chat`) — `authenticated_chat` | `authenticated_form`
- `isArchived` (boolean, default false) — para ocultar en inbox sin cerrar el pipeline
- `metaJson` (string, no requerido) — JSON serializado para extras (fechas tentativas, presupuesto, etc.)

**Campos a eliminar**
- `name`
- `email`
- `phone`
- `message` (reemplazado por `lastMessage` y/o por `messages` del chat)

#### Índices a agregar/ajustar
- `idx_leads_userid` (idx: `userId ↑`) — ver leads por cliente
- `uq_leads_user_resource_open` (uq lógico mediante Function): no se puede crear otro lead “abierto” para (userId, resourceId) si status ∈ {new, contacted}.  
  Nota: Appwrite unique index no soporta “partial unique”, así que el enforcement debe ser por Function.

Mantén índices existentes por `resourceId`, `resourceOwnerUserId`, `status`, `$createdAt`.

### 3.2 Colecciones `conversations` y `messages`
Validar que:
- `conversations` contenga `resourceId`, `ownerUserId` (o `resourceOwnerUserId`), `clientUserId`.
- `messages` contenga `conversationId`, `senderUserId`, `body`, `type`, timestamps.

Acción:
- Si falta “participantes” o “resourceId” en conversations, ajustarlo en schema doc y Appwrite.
- Asegurar que la conversación sea accesible solo por participantes (y staff/owner según scopes).

### 3.3 Colección `reservations` — agregar holdExpiresAt
Para reservas confiables con “hold”:
- Agregar `holdExpiresAt` (datetime, no requerido) en `reservations`.

Regla:
- Cuando una reserva se cree en estado `pending`, setear `holdExpiresAt = now + HOLD_MINUTES` (ej. 15 min).
- Cuando se confirme el pago, `holdExpiresAt` puede mantenerse o limpiarse.

### 3.4 Colección `reservation_payments`
Ya existe y sirve para idempotencia. Validar que tenga:
- provider (`stripe`)
- providerEventId (unique / índice)
- status (pending/succeeded/failed/refunded)
- amounts/currency
- reservationId

No cambiar si ya cubre lo anterior.

---

## 4) Backend (Appwrite Functions) — cambios exactos

### 4.1 Eliminar Functions “public leads”
Eliminar completamente:
- `create-lead-public`
- cualquier trigger que dependa de lead público, si deja de tener sentido

Ajustar:
- `send-lead-notification`: que dispare cuando se cree un lead autenticado.

Actualizar `06_appwrite_functions_catalog.md` para reflejar los cambios.

### 4.2 Crear Function: `create-lead` (AUTH REQUIRED)
Nueva Function HTTP POST autenticada.

**Input**
- `resourceId` (required)
- `message` (required) — texto inicial de pregunta/cotización
- opcional: `meta` (objeto) — fechas tentativas, horario, presupuesto, etc.

**Reglas**
1) Validar usuario autenticado.
2) Validar módulos requeridos:
   - `module.resources`
   - `module.leads`
   - `module.messaging.realtime` (si se crea conversación automáticamente)
3) Obtener recurso por `resourceId` y derivar `resourceOwnerUserId`.
4) Upsert “lead abierto”:
   - buscar lead por `resourceId + userId` con `status in (new, contacted)` y `enabled=true`
   - si existe: actualizar `lastMessage`, y si no tiene conversationId crearla (según estrategia)
   - si no existe: crear lead `status=new`
5) Crear/abrir conversación:
   - buscar conversación existente por `(resourceId, clientUserId=userId, ownerUserId=resourceOwnerUserId)` con `enabled=true`
   - si existe: usarla
   - si no existe: crearla
6) Crear primer mensaje en `messages` (sender = clientUserId).
7) Guardar `conversationId` en lead.
8) Responder: `leadId`, `conversationId`.

**Output**
- `{ leadId, conversationId }`

### 4.3 Reservas: completar `create-reservation-public` (AUTH REQUIRED) con lock
Asegurar que `create-reservation-public` haga:

**A) Validación**
- Usuario autenticado.
- `module.resources` + módulo de booking según `commercialMode`.
- Rechazar `bookingType=manual_contact` con error funcional (debe usar create-lead).
- Validar límite `maxActiveReservationsPerMonth` (ya descrito en catálogo).

**B) Normalización de fechas**
- `date_range`: usar `checkInDate/checkOutDate` y aplicar check-in/out time si aplica.
- `time_slot/fixed_event`: usar `startDateTime/endDateTime`.

**C) Anti double-booking (overlap)**
Implementar consulta y regla de solapamiento en Appwrite:
- Considerar reservas con `status in (pending, confirmed)` donde:
  - pending solo cuenta si `holdExpiresAt > now`
  - confirmed siempre cuenta
- `date_range`: overlap si `existing.checkInDate < new.checkOutDate` AND `existing.checkOutDate > new.checkInDate`
- `time_slot/fixed_event`: overlap si `existing.startDateTime < new.endDateTime` AND `existing.endDateTime > new.startDateTime`
- Aplicar `slotBufferMinutes` del recurso: expandir ventanas en ambos lados si corresponde.

**D) Holds**
- Crear reserva en `status=pending`, `paymentStatus=unpaid`.
- Setear `holdExpiresAt = now + 15 minutos` (configurable por `instance_settings` si existe).

**E) Idempotencia**
- Aceptar un `clientRequestId` opcional para evitar duplicados si el cliente reintenta.
- Guardar `clientRequestId` en `reservations` o en `reservation_payments` (si ya existe).
- Si ya existe una reserva pending con el mismo `clientRequestId`, retornar esa.

### 4.4 Nueva Function programada: `expire-pending-reservations`
Schedule cada 5 minutos.

Regla:
- Buscar `reservations` con `status=pending` y `holdExpiresAt <= now` y `paymentStatus=unpaid`
- Marcar `status=expired`
- Registrar en `activity_logs`

### 4.5 Pagos: `create-payment-session` (AUTH REQUIRED) con Connect
Asegurar que:
- Valide que la reserva está `pending` y no expirada.
- Si está expirada -> error funcional.
- Cree Checkout Session o PaymentIntent en Stripe.
- Registre/actualice `reservation_payments` como `pending`.

**Connect**
- Resolver el `resourceOwnerUserId` y su `stripeAccountId` (ver sección 5).
- Crear cobro con destination charge:
  - `application_fee_amount` (tu comisión)
  - `transfer_data[destination] = stripeAccountId`
  - (opcional) `on_behalf_of = stripeAccountId` según estrategia de settlement.

### 4.6 Webhook Stripe: `payment-webhook-stripe`
Confirmar que:
- Verifica firma de webhook.
- Usa idempotencia por `providerEventId`.
- En `checkout.session.completed` o eventos relevantes:
  - marcar `reservation_payments` como `succeeded`
  - actualizar `reservations`:
    - `paymentStatus=paid`
    - `status=confirmed`
  - emitir voucher (`issue-reservation-voucher`) si aplica

---

## 5) Stripe Connect — qué requieres para operar (checklist)

### 5.1 En Stripe (cuenta plataforma)
- Crear cuenta Stripe de la plataforma (negocio).
- Activar Stripe Connect.
- Configurar Webhook endpoint para eventos de pagos (Connect).
- Tener llaves:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - (si usas Checkout) `STRIPE_PUBLISHABLE_KEY` para frontend

### 5.2 En tu sistema (Appwrite)
Agregar un campo para owners/proveedores:
- En `users` o perfil de “owner”:
  - `stripeAccountId` (string, no requerido)
  - `stripeOnboardingStatus` (enum: `not_started/pending/complete/restricted`)
  - `stripeOnboardingUrl` (string, temporal, opcional)

Crear functions:
- `stripe-create-connected-account` (owner/root) -> crea connected account tipo Express
- `stripe-create-account-link` (owner) -> devuelve link onboarding
- `stripe-refresh-account-link` (owner) -> si expira
- `stripe-get-account-status` (system) -> valida capabilities/requirements

### 5.3 Política mínima de payouts
- Solo permitir pagos online si:
  - owner tiene `stripeAccountId`
  - su onboarding está `complete` y tiene capability de card payments + transfers habilitada
Si no:
- Degradar a modo “agent_only” (solo lead/chat) o “pago offline”, según módulos.

---

## 6) Frontend — cambios exactos

### 6.1 Eliminar UI pública de leads
- No mostrar botones de contacto/cotización cuando no hay sesión.
- En su lugar:
  - CTA: “Inicia sesión para cotizar” o “Regístrate para pedir cotización”
  - Redirigir a auth con `redirect` de regreso al resource.

### 6.2 Flujo autenticado: “Pedir cotización / Hablar con agente”
- Botón visible solo con sesión.
- Acción:
  1) llamar Function `create-lead`
  2) navegar a vista de chat con `conversationId`
- En la vista del recurso, si ya existe lead abierto para ese usuario, mostrar:
  - “Continuar conversación” (reusa conversation)

### 6.3 Reservas
- Para `bookingType != manual_contact`:
  - UI de selección de fechas/horas
  - llamar `create-reservation-public` (auth)
  - si requiere pago online, redirigir a checkout creado por `create-payment-session`
- Mostrar estados:
  - pending: “Apartado temporalmente, completa el pago antes de X”
  - expired: “El apartado expiró”
  - confirmed: mostrar voucher

---

## 7) Limpieza (“eliminar la basura”)

### 7.1 Código backend
- Borrar `create-lead-public` y rutas relacionadas.
- Borrar componentes/forms públicos de lead.
- Eliminar referencias legacy `propertyId` en leads (si aún existieran) y mantenerlo solo donde sea imprescindible por compatibilidad temporal (reservas/pagos ya tienen fallback).

### 7.2 Documentación
Actualizar obligatoriamente:
- `03_appwrite_db_schema.md`:
  - sección `leads` (nuevo contrato)
  - `reservations` (agregar `holdExpiresAt`)
  - cualquier relación lead↔conversation
- `05_permissions_and_roles.md`:
  - leads create ya no es público, requiere auth y function `create-lead`
  - “visitor” no puede crear leads
- `06_appwrite_functions_catalog.md`:
  - eliminar `create-lead-public`
  - agregar `create-lead`
  - agregar `expire-pending-reservations`
  - agregar functions de Stripe Connect onboarding (mínimo)
- Si existe “wizard flows” que asume lead público, ajustarlo.

---

## 8) Criterios de aceptación (QA)

### Leads + Chat
- Un usuario no autenticado no puede crear lead.
- Usuario autenticado puede crear lead para un recurso y entra a chat.
- Reintentar “pedir cotización” no crea duplicados: reusa lead abierto + conversation.
- Owner/staff ve inbox de leads y puede cambiar status.

### Reservas
- Dos usuarios no pueden reservar el mismo slot/fecha si hay overlap.
- Una reserva pending expira automáticamente en ~15 min y libera disponibilidad.
- Al pagar, pasa a confirmed.
- Webhook es idempotente.

### Stripe Connect
- Si owner no está onboarded, pagos online están bloqueados con error claro.
- Con owner onboarded, checkout cobra y transfiere a connected account, dejando fee en platform.

---

## 9) Orden recomendado de implementación (para el agent)

1) Refactor DB schema docs y Appwrite collection `leads` + `reservations.holdExpiresAt`.
2) Eliminar `create-lead-public` + limpiar frontend.
3) Implementar `create-lead` (auth) + creación/reuso de conversación + primer mensaje.
4) Completar `create-reservation-public` con overlap + hold + idempotencia.
5) Implementar `expire-pending-reservations` scheduled.
6) Integrar Connect:
   - añadir campos `stripeAccountId` y estados
   - onboarding functions
   - `create-payment-session` con destination charge
   - webhook confirmación

---

## 10) Notas de seguridad
- Todo lo que afecte disponibilidad (reservas) debe validarse en backend.
- Leads/chat: permisos por participantes + scopes.
- Webhooks: validar firma y usar idempotencia por eventId.
