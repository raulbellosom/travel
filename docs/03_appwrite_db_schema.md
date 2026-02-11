# 03_APPWRITE_DB_SCHEMA.md - REAL ESTATE SAAS PLATFORM

## Referencia

Este documento depende de:

- `00_project_brief.md`
- `02_backend_appwrite_requirements.md`

---

## Proposito

Fuente de verdad del schema Appwrite para una instancia dedicada por cliente.

Regla principal:

- Una instancia Appwrite por cliente.
- Este schema se aplica completo en cada nueva instancia.

---

## Convenciones Obligatorias

### Reglas de atributos Appwrite

1. Si `required = yes`, entonces `default` debe ser `-`.
2. Si `default` tiene valor, entonces `required` debe ser `no`.
3. `string` siempre define `size` (longitud maxima por elemento).
4. `integer` y `float` siempre definen `min` y `max` en `constraint`.
5. Atributos array se documentan unicamente en `Type` usando `[]`.
6. Para arrays de `string[]`, el `size` aplica a cada elemento.
7. Campos JSON se guardan como `string` serializado y con `size` definido.

### Formato de tablas de atributos

| Attribute | Type | Size | Required | Default | Constraint |
| --------- | ---- | ---- | -------- | ------- | ---------- |

### Formato de indices

- Tipos permitidos: `idx` (key), `uq` (unique), `full` (fulltext).
- Direccion en keys/composite: `↑` asc, `↓` desc.
- Fulltext no usa flechas.

| Index Name | Type | Attributes | Notes |
| ---------- | ---- | ---------- | ----- |

### Campos de sistema Appwrite

Estos campos existen en todos los documentos y no se crean como atributos manuales:

- `$id` (string): ID unico del documento.
- `$createdAt` (datetime): fecha/hora de creacion.
- `$updatedAt` (datetime): fecha/hora de ultima actualizacion.

Regla:

- En este documento, cualquier indice temporal debe usar `$createdAt` o `$updatedAt`, no `createdAt`/`updatedAt` custom.

---

## Instancia Appwrite

- Endpoint: `https://appwrite.racoondevs.com`
- Version recomendada: `>= 1.8.x`
- Database ID: `main`
- Database Name: `RealEstateClientDB`

---

## Storage Buckets

| Bucket ID         | Purpose                  | Max Size | Public | Extensions        |
| ----------------- | ------------------------ | -------- | ------ | ----------------- |
| `property-images` | Imagenes publicas        | 10 MB    | Yes    | jpg,jpeg,png,webp |
| `avatars`         | Avatares internos        | 5 MB     | No     | jpg,jpeg,png,webp |
| `documents`       | Contratos y comprobantes | 20 MB    | No     | pdf,jpg,jpeg,png  |

---

## Collections - Resumen

| Collection ID          | Purpose                                 | Phase |
| ---------------------- | --------------------------------------- | ----- |
| `users`                | Perfiles y roles internos               | 0     |
| `user_preferences`     | Preferencias de UI y branding base      | 0     |
| `properties`           | Catalogo de propiedades                 | 0     |
| `property_images`      | Galeria por propiedad                   | 0     |
| `amenities`            | Catalogo de amenidades                  | 0     |
| `property_amenities`   | Relacion many-to-many                   | 0     |
| `leads`                | Mensajes/contactos                      | 0     |
| `reservations`         | Reservaciones                           | 0     |
| `reservation_payments` | Intentos/confirmaciones de pago         | 0     |
| `reservation_vouchers` | Voucher emitido por reserva pagada      | 0     |
| `reviews`              | Resenas de clientes                     | 0     |
| `analytics_daily`      | Agregados diarios para dashboard        | 0     |
| `activity_logs`        | Auditoria detallada (panel oculto root) | 0     |
| `email_verifications`  | Tokens de verificacion de correo        | 0     |

---

## Collection: users

Purpose: perfiles de usuarios internos de la instancia.

### Attributes

| Attribute    | Type    | Size | Required | Default | Constraint                                                    |
| ------------ | ------- | ---- | -------- | ------- | ------------------------------------------------------------- |
| `authId`     | string  | 64   | yes      | -       | regex `^[A-Za-z0-9._-]{1,64}$`                                |
| `email`      | email   | 254  | yes      | -       | email valido                                                  |
| `firstName`  | string  | 80   | yes      | -       | min 1                                                         |
| `lastName`   | string  | 80   | yes      | -       | min 1                                                         |
| `phone`      | string  | 20   | no       | -       | regex telefono internacional                                  |
| `birthDate`  | string  | 10   | no       | -       | regex `^\\d{4}-\\d{2}-\\d{2}$`                                |
| `role`       | enum    | -    | yes      | -       | `root`,`owner`,`staff_manager`,`staff_editor`,`staff_support` |
| `scopesJson` | string  | 4000 | no       | -       | JSON array serializado                                        |
| `isHidden`   | boolean | -    | no       | false   | -                                                             |
| `enabled`    | boolean | -    | no       | true    | -                                                             |

Notas:

- `authId`: Debe coincidir con Auth user id
- `email`: Unico
- `birthDate`: Fecha de nacimiento en formato `YYYY-MM-DD`
- `role`: Rol de aplicacion
- `scopesJson`: Permisos finos
- `isHidden`: `true` para root
- `enabled`: Soft delete

### Indexes

| Index Name            | Type | Attributes     | Notes                    |
| --------------------- | ---- | -------------- | ------------------------ |
| `uq_users_authid`     | uq   | `authId ↑`     | Unico por Auth ID        |
| `uq_users_email`      | uq   | `email ↑`      | Unico por email          |
| `idx_users_role`      | idx  | `role ↑`       | Filtro por rol           |
| `idx_users_hidden`    | idx  | `isHidden ↑`   | Excluir root en listados |
| `idx_users_enabled`   | idx  | `enabled ↑`    | Usuarios activos         |
| `idx_users_createdat` | idx  | `$createdAt ↓` | Orden reciente           |

### Permissions

- Lectura/actualizacion directa: `Role.user(authId)`.
- Gestion de staff/roles: solo via Functions (owner/root).

---

## Collection: user_preferences

Purpose: preferencias de UI y branding base por usuario.

### Attributes

| Attribute             | Type    | Size | Required | Default   | Constraint                |
| --------------------- | ------- | ---- | -------- | --------- | ------------------------- |
| `userId`              | string  | 64   | yes      | -         | FK logical a `users.$id`  |
| `theme`               | enum    | -    | no       | `system`  | `light`,`dark`,`system`   |
| `locale`              | enum    | -    | no       | `es`      | `es`,`en`                 |
| `brandPrimaryColor`   | string  | 7    | no       | `#0F172A` | regex `^#[0-9A-Fa-f]{6}$` |
| `brandSecondaryColor` | string  | 7    | no       | `#16A34A` | regex `^#[0-9A-Fa-f]{6}$` |
| `brandFontHeading`    | string  | 80   | no       | `Poppins` | min 1                     |
| `brandFontBody`       | string  | 80   | no       | `Inter`   | min 1                     |
| `enabled`             | boolean | -    | no       | true      | -                         |

Notas:

- `userId`: Un registro por usuario
- `brandPrimaryColor`: Hex
- `brandSecondaryColor`: Hex

### Indexes

| Index Name             | Type | Attributes | Notes                   |
| ---------------------- | ---- | ---------- | ----------------------- |
| `uq_userprefs_userid`  | uq   | `userId ↑` | Un registro por usuario |
| `idx_userprefs_locale` | idx  | `locale ↑` | Filtro idioma           |

### Permissions

- `Role.user(userId)` para lectura y escritura.

---

## Collection: properties

Purpose: catalogo de propiedades del cliente.

### Attributes

| Attribute          | Type     | Size | Required | Default | Constraint                                                   |
| ------------------ | -------- | ---- | -------- | ------- | ------------------------------------------------------------ |
| `ownerUserId`      | string   | 64   | yes      | -       | FK logical a `users.$id`                                     |
| `slug`             | string   | 150  | yes      | -       | regex slug unico                                             |
| `title`            | string   | 200  | yes      | -       | min 3                                                        |
| `description`      | string   | 5000 | yes      | -       | min 20                                                       |
| `propertyType`     | enum     | -    | yes      | -       | `house`,`apartment`,`land`,`commercial`,`office`,`warehouse` |
| `operationType`    | enum     | -    | yes      | -       | `sale`,`rent`,`vacation_rental`                              |
| `price`            | float    | -    | yes      | -       | min `0`, max `999999999`                                     |
| `currency`         | enum     | -    | no       | `MXN`   | `MXN`,`USD`,`EUR`                                            |
| `city`             | string   | 100  | yes      | -       | min 2                                                        |
| `state`            | string   | 100  | yes      | -       | min 2                                                        |
| `country`          | string   | 2    | no       | `MX`    | ISO2                                                         |
| `bedrooms`         | integer  | -    | no       | 0       | min `0`, max `50`                                            |
| `bathrooms`        | float    | -    | no       | 0       | min `0`, max `50`                                            |
| `maxGuests`        | integer  | -    | no       | 0       | min `1`, max `500`                                           |
| `galleryImageIds`  | string[] | 64   | no       | -       | max 50 elementos, cada elemento size 64                      |
| `status`           | enum     | -    | no       | `draft` | `draft`,`published`,`inactive`,`archived`                    |
| `featured`         | boolean  | -    | no       | false   | -                                                            |
| `views`            | integer  | -    | no       | 0       | min `0`, max `2147483647`                                    |
| `contactCount`     | integer  | -    | no       | 0       | min `0`, max `2147483647`                                    |
| `reservationCount` | integer  | -    | no       | 0       | min `0`, max `2147483647`                                    |
| `enabled`          | boolean  | -    | no       | true    | -                                                            |

Notas:

- `ownerUserId`: Propietario interno
- `slug`: URL publica
- `price`: Precio base
- `bathrooms`: Permite medios banos
- `maxGuests`: Reservas
- `galleryImageIds`: `string[]` para lista rapida de file IDs
- `views`: Contador
- `contactCount`: Contador
- `reservationCount`: Contador
- `enabled`: Soft delete

### Indexes

| Index Name                   | Type | Attributes               | Notes                  |
| ---------------------------- | ---- | ------------------------ | ---------------------- |
| `uq_properties_slug`         | uq   | `slug ↑`                 | Slug unico             |
| `idx_properties_owneruserid` | idx  | `ownerUserId ↑`          | Dashboard del owner    |
| `idx_properties_status`      | idx  | `status ↑`               | Publicadas/borrador    |
| `idx_properties_city`        | idx  | `city ↑`                 | Filtro geografico      |
| `idx_properties_featured`    | idx  | `featured ↓`             | Destacadas primero     |
| `idx_properties_createdat`   | idx  | `$createdAt ↓`           | Recientes              |
| `idx_properties_status_date` | idx  | `status ↑, $createdAt ↓` | Lista publica paginada |
| `full_properties_search`     | full | `title,description`      | Fulltext               |

### Permissions

- Lectura publica solo para propiedades `published` y `enabled=true`.
- Escritura por owner/staff via Functions con validacion de scope.

---

## Collection: property_images

Purpose: metadata de imagen por propiedad.

### Attributes

| Attribute    | Type    | Size | Required | Default | Constraint                            |
| ------------ | ------- | ---- | -------- | ------- | ------------------------------------- |
| `propertyId` | string  | 64   | yes      | -       | FK logical a `properties.$id`         |
| `fileId`     | string  | 64   | yes      | -       | FK logical a bucket `property-images` |
| `altText`    | string  | 200  | no       | -       | min 3                                 |
| `sortOrder`  | integer | -    | no       | 0       | min `0`, max `999`                    |
| `isMain`     | boolean | -    | no       | false   | -                                     |
| `width`      | integer | -    | no       | -       | min `1`, max `20000`                  |
| `height`     | integer | -    | no       | -       | min `1`, max `20000`                  |
| `fileSize`   | integer | -    | no       | -       | min `1`, max `10485760`               |
| `enabled`    | boolean | -    | no       | true    | -                                     |

Notas:

- `altText`: SEO/accesibilidad
- `sortOrder`: Orden de galeria
- `isMain`: Imagen principal
- `width`: Metadato
- `height`: Metadato
- `fileSize`: Bytes
- `enabled`: Soft delete

### Indexes

| Index Name                  | Type | Attributes                  | Notes                               |
| --------------------------- | ---- | --------------------------- | ----------------------------------- |
| `idx_propimages_propertyid` | idx  | `propertyId ↑`              | Todas las imagenes de una propiedad |
| `idx_propimages_sortorder`  | idx  | `propertyId ↑, sortOrder ↑` | Orden de galeria                    |
| `idx_propimages_main`       | idx  | `propertyId ↑, isMain ↓`    | Encontrar principal rapido          |

### Permissions

- Lectura publica en contexto de propiedad publicada.
- Escritura por owner/staff autorizado.

---

## Collection: amenities

Purpose: catalogo global de amenidades.

### Attributes

| Attribute  | Type    | Size | Required | Default   | Constraint                                       |
| ---------- | ------- | ---- | -------- | --------- | ------------------------------------------------ |
| `slug`     | string  | 100  | yes      | -         | regex slug unico                                 |
| `name_es`  | string  | 100  | yes      | -         | min 2                                            |
| `name_en`  | string  | 100  | yes      | -         | min 2                                            |
| `category` | enum    | -    | no       | `general` | `general`,`security`,`outdoor`,`services`,`tech` |
| `enabled`  | boolean | -    | no       | true      | -                                                |

Notas:

### Indexes

| Index Name               | Type | Attributes   | Notes                |
| ------------------------ | ---- | ------------ | -------------------- |
| `uq_amenities_slug`      | uq   | `slug ↑`     | Unico                |
| `idx_amenities_category` | idx  | `category ↑` | Filtro por categoria |
| `idx_amenities_enabled`  | idx  | `enabled ↑`  | Solo activas         |

### Permissions

- Lectura publica de amenidades activas.
- Escritura solo por owner/root via Function.

---

## Collection: property_amenities

Purpose: relacion many-to-many entre propiedades y amenidades.

### Attributes

| Attribute    | Type   | Size | Required | Default | Constraint                    |
| ------------ | ------ | ---- | -------- | ------- | ----------------------------- |
| `propertyId` | string | 64   | yes      | -       | FK logical a `properties.$id` |
| `amenityId`  | string | 64   | yes      | -       | FK logical a `amenities.$id`  |

Notas:

### Indexes

| Index Name                | Type | Attributes                  | Notes                    |
| ------------------------- | ---- | --------------------------- | ------------------------ |
| `uq_propamen_combo`       | uq   | `propertyId ↑, amenityId ↑` | Evita duplicados         |
| `idx_propamen_propertyid` | idx  | `propertyId ↑`              | Amenidades de propiedad  |
| `idx_propamen_amenityid`  | idx  | `amenityId ↑`               | Propiedades por amenidad |

### Permissions

- Lectura publica en contexto de propiedad publicada.
- Escritura por owner/staff autorizado.

---

## Collection: leads

Purpose: mensajes de contacto del sitio publico.

### Attributes

| Attribute         | Type    | Size | Required | Default | Constraint                                   |
| ----------------- | ------- | ---- | -------- | ------- | -------------------------------------------- |
| `propertyId`      | string  | 64   | yes      | -       | FK logical a `properties.$id`                |
| `propertyOwnerId` | string  | 64   | yes      | -       | FK logical a `users.$id`                     |
| `name`            | string  | 120  | yes      | -       | min 2                                        |
| `email`           | email   | 254  | yes      | -       | email valido                                 |
| `phone`           | string  | 20   | no       | -       | regex telefono internacional                 |
| `message`         | string  | 2000 | yes      | -       | min 5                                        |
| `status`          | enum    | -    | no       | `new`   | `new`,`contacted`,`closed_won`,`closed_lost` |
| `notes`           | string  | 4000 | no       | -       | -                                            |
| `enabled`         | boolean | -    | no       | true    | -                                            |

Notas:

- `propertyOwnerId`: Permisos
- `name`: Contacto
- `email`: Contacto
- `phone`: Contacto
- `message`: Mensaje
- `status`: Pipeline
- `notes`: Notas internas
- `enabled`: Soft delete

### Indexes

| Index Name            | Type | Attributes                        | Notes            |
| --------------------- | ---- | --------------------------------- | ---------------- |
| `idx_leads_ownerid`   | idx  | `propertyOwnerId ↑`               | Inbox por owner  |
| `idx_leads_status`    | idx  | `status ↑`                        | Filtro pipeline  |
| `idx_leads_createdat` | idx  | `$createdAt ↓`                    | Recientes        |
| `idx_leads_ownerdate` | idx  | `propertyOwnerId ↑, $createdAt ↓` | Dashboard rapido |

### Permissions

- Creacion publica via Function.
- Lectura/escritura para owner/staff con scope de leads.

---

## Collection: reservations

Purpose: reservaciones por propiedad.

### Attributes

| Attribute         | Type     | Size | Required | Default   | Constraint                                              |
| ----------------- | -------- | ---- | -------- | --------- | ------------------------------------------------------- |
| `propertyId`      | string   | 64   | yes      | -         | FK logical a `properties.$id`                           |
| `propertyOwnerId` | string   | 64   | yes      | -         | FK logical a `users.$id`                                |
| `guestName`       | string   | 120  | yes      | -         | min 2                                                   |
| `guestEmail`      | email    | 254  | yes      | -         | email valido                                            |
| `guestPhone`      | string   | 20   | no       | -         | regex telefono internacional                            |
| `checkInDate`     | datetime | -    | yes      | -         | ISO 8601 UTC                                            |
| `checkOutDate`    | datetime | -    | yes      | -         | ISO 8601 UTC, > `checkInDate`                           |
| `guestCount`      | integer  | -    | yes      | -         | min `1`, max `500`                                      |
| `nights`          | integer  | -    | yes      | -         | min `1`, max `365`                                      |
| `baseAmount`      | float    | -    | yes      | -         | min `0`, max `999999999`                                |
| `feesAmount`      | float    | -    | no       | 0         | min `0`, max `999999999`                                |
| `taxAmount`       | float    | -    | no       | 0         | min `0`, max `999999999`                                |
| `totalAmount`     | float    | -    | yes      | -         | min `0`, max `999999999`                                |
| `currency`        | enum     | -    | no       | `MXN`     | `MXN`,`USD`,`EUR`                                       |
| `status`          | enum     | -    | no       | `pending` | `pending`,`confirmed`,`cancelled`,`completed`,`expired` |
| `paymentStatus`   | enum     | -    | no       | `unpaid`  | `unpaid`,`pending`,`paid`,`failed`,`refunded`           |
| `paymentProvider` | enum     | -    | no       | -         | `stripe`,`mercadopago`,`manual`                         |
| `externalRef`     | string   | 120  | no       | -         | id externo de reserva/pago                              |
| `specialRequests` | string   | 2000 | no       | -         | -                                                       |
| `enabled`         | boolean  | -    | no       | true      | -                                                       |

Notas:

- `nights`: Calculado
- `status`: Estado reserva
- `paymentStatus`: Estado pago
- `enabled`: Soft delete

### Indexes

| Index Name                       | Type | Attributes                        | Notes                  |
| -------------------------------- | ---- | --------------------------------- | ---------------------- |
| `idx_reservations_propertyid`    | idx  | `propertyId ↑`                    | Reservas por propiedad |
| `idx_reservations_ownerid`       | idx  | `propertyOwnerId ↑`               | Reservas por owner     |
| `idx_reservations_checkin`       | idx  | `checkInDate ↑`                   | Agenda                 |
| `idx_reservations_status`        | idx  | `status ↑`                        | Filtro de estado       |
| `idx_reservations_paymentstatus` | idx  | `paymentStatus ↑`                 | Filtro de pago         |
| `idx_reservations_createdat`     | idx  | `$createdAt ↓`                    | Recientes              |
| `idx_reservations_ownerdate`     | idx  | `propertyOwnerId ↑, $createdAt ↓` | Dashboard              |

### Permissions

- Creacion publica via Function.
- Lectura/escritura para owner/staff con scope de reservas.

---

## Collection: reservation_payments

Purpose: ledger de intentos y resultados de pago.

### Attributes

| Attribute           | Type     | Size  | Required | Default   | Constraint                                 |
| ------------------- | -------- | ----- | -------- | --------- | ------------------------------------------ |
| `reservationId`     | string   | 64    | yes      | -         | FK logical a `reservations.$id`            |
| `propertyOwnerId`   | string   | 64    | yes      | -         | FK logical a `users.$id`                   |
| `provider`          | enum     | -     | yes      | -         | `stripe`,`mercadopago`                     |
| `providerPaymentId` | string   | 120   | no       | -         | ID de pago externo                         |
| `providerEventId`   | string   | 120   | no       | -         | ID unico de webhook para idempotencia      |
| `amount`            | float    | -     | yes      | -         | min `0`, max `999999999`                   |
| `currency`          | enum     | -     | no       | `MXN`     | `MXN`,`USD`,`EUR`                          |
| `status`            | enum     | -     | no       | `pending` | `pending`,`approved`,`rejected`,`refunded` |
| `rawPayload`        | string   | 20000 | no       | -         | JSON serializado de proveedor              |
| `processedAt`       | datetime | -     | no       | -         | ISO 8601 UTC                               |
| `enabled`           | boolean  | -     | no       | true      | -                                          |

Notas:

### Indexes

| Index Name                      | Type | Attributes          | Notes                |
| ------------------------------- | ---- | ------------------- | -------------------- |
| `idx_respayments_reservationid` | idx  | `reservationId ↑`   | Pagos por reserva    |
| `idx_respayments_ownerid`       | idx  | `propertyOwnerId ↑` | Dashboard pagos      |
| `idx_respayments_provider`      | idx  | `provider ↑`        | Filtro proveedor     |
| `uq_respayments_eventid`        | uq   | `providerEventId ↑` | Idempotencia webhook |
| `idx_respayments_status`        | idx  | `status ↑`          | Filtro de estado     |
| `idx_respayments_createdat`     | idx  | `$createdAt ↓`      | Recientes            |

### Permissions

- Solo system/functions.
- Lectura al dashboard via endpoint controlado.

---

## Collection: reservation_vouchers

Purpose: comprobante emitido cuando la reserva queda confirmada.

### Attributes

| Attribute         | Type     | Size | Required | Default | Constraint                      |
| ----------------- | -------- | ---- | -------- | ------- | ------------------------------- |
| `reservationId`   | string   | 64   | yes      | -       | FK logical a `reservations.$id` |
| `propertyOwnerId` | string   | 64   | yes      | -       | FK logical a `users.$id`        |
| `voucherCode`     | string   | 40   | yes      | -       | regex `^[A-Z0-9-]{6,40}$`       |
| `voucherUrl`      | string   | 750  | no       | -       | URL interna o publica           |
| `qrPayload`       | string   | 2000 | no       | -       | JSON o token para QR            |
| `issuedAt`        | datetime | -    | yes      | -       | ISO 8601 UTC                    |
| `sentToEmail`     | email    | 254  | no       | -       | email valido                    |
| `enabled`         | boolean  | -    | no       | true    | -                               |

Notas:

- `voucherCode`: Unico
- `voucherUrl`: PDF/web

### Indexes

| Index Name                      | Type | Attributes          | Notes               |
| ------------------------------- | ---- | ------------------- | ------------------- |
| `uq_resvouchers_code`           | uq   | `voucherCode ↑`     | Codigo unico        |
| `idx_resvouchers_reservationid` | idx  | `reservationId ↑`   | Voucher por reserva |
| `idx_resvouchers_ownerid`       | idx  | `propertyOwnerId ↑` | Dashboard owner     |

### Permissions

- Escritura solo por Functions.
- Lectura por owner/staff autorizado o endpoint publico por token.

---

## Collection: reviews

Purpose: resenas asociadas a reservas completadas.

### Attributes

| Attribute         | Type     | Size | Required | Default   | Constraint                       |
| ----------------- | -------- | ---- | -------- | --------- | -------------------------------- |
| `propertyId`      | string   | 64   | yes      | -         | FK logical a `properties.$id`    |
| `reservationId`   | string   | 64   | yes      | -         | FK logical a `reservations.$id`  |
| `authorName`      | string   | 120  | yes      | -         | min 2                            |
| `authorEmailHash` | string   | 128  | no       | -         | hash sha256/base64               |
| `rating`          | integer  | -    | yes      | -         | min `1`, max `5`                 |
| `title`           | string   | 160  | no       | -         | min 3                            |
| `comment`         | string   | 3000 | yes      | -         | min 10                           |
| `status`          | enum     | -    | no       | `pending` | `pending`,`published`,`rejected` |
| `publishedAt`     | datetime | -    | no       | -         | ISO 8601 UTC                     |
| `enabled`         | boolean  | -    | no       | true      | -                                |

Notas:

- `reservationId`: Elegibilidad
- `authorName`: Publico
- `authorEmailHash`: Anti abuso
- `status`: Moderacion
- `enabled`: Soft delete

### Indexes

| Index Name               | Type | Attributes     | Notes                 |
| ------------------------ | ---- | -------------- | --------------------- |
| `idx_reviews_propertyid` | idx  | `propertyId ↑` | Resenas por propiedad |
| `idx_reviews_status`     | idx  | `status ↑`     | Cola de moderacion    |
| `idx_reviews_rating`     | idx  | `rating ↓`     | Top rating            |
| `idx_reviews_createdat`  | idx  | `$createdAt ↓` | Recientes             |

### Permissions

- Creacion publica via Function con validacion de reserva.
- Moderacion por owner/staff con scope.

---

## Collection: analytics_daily

Purpose: agregados diarios para estadisticas y visualizaciones.

### Attributes

| Attribute             | Type     | Size | Required | Default | Constraint                   |
| --------------------- | -------- | ---- | -------- | ------- | ---------------------------- |
| `metricDate`          | datetime | -    | yes      | -       | ISO 8601 UTC, truncado a dia |
| `propertiesPublished` | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `leadsCreated`        | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `reservationsCreated` | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `paymentsApproved`    | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `grossRevenue`        | float    | -    | no       | 0       | min `0`, max `999999999`     |
| `currency`            | enum     | -    | no       | `MXN`   | `MXN`,`USD`,`EUR`            |
| `payloadJson`         | string   | 8000 | no       | -       | JSON serializado             |

Notas:

- `metricDate`: Clave diaria
- `propertiesPublished`: KPI
- `leadsCreated`: KPI
- `reservationsCreated`: KPI
- `paymentsApproved`: KPI
- `grossRevenue`: KPI
- `payloadJson`: KPIs extra

### Indexes

| Index Name                | Type | Attributes     | Notes               |
| ------------------------- | ---- | -------------- | ------------------- |
| `uq_analytics_metricdate` | uq   | `metricDate ↑` | Un registro por dia |
| `idx_analytics_createdat` | idx  | `$createdAt ↓` | Recientes           |

### Permissions

- Escritura por Function agregadora.
- Lectura por owner/staff con permiso de analitica.

---

## Collection: activity_logs

Purpose: auditoria forense para panel root.

### Attributes

| Attribute       | Type     | Size  | Required | Default | Constraint                                                    |
| --------------- | -------- | ----- | -------- | ------- | ------------------------------------------------------------- |
| `actorUserId`   | string   | 64    | yes      | -       | FK logical a `users.$id`                                      |
| `actorRole`     | string   | 40    | yes      | -       | `root`,`owner`,`staff_manager`,`staff_editor`,`staff_support` |
| `action`        | string   | 80    | yes      | -       | verbo de accion                                               |
| `entityType`    | string   | 80    | yes      | -       | nombre coleccion o dominio                                    |
| `entityId`      | string   | 64    | no       | -       | ID de entidad                                                 |
| `beforeData`    | string   | 20000 | no       | -       | JSON serializado antes del cambio                             |
| `afterData`     | string   | 20000 | no       | -       | JSON serializado despues del cambio                           |
| `changedFields` | string[] | 120   | no       | -       | max 100 elementos                                             |
| `changeSummary` | string   | 500   | no       | -       | resumen corto                                                 |
| `requestId`     | string   | 100   | no       | -       | correlacion                                                   |
| `ipHash`        | string   | 128   | no       | -       | hash no reversible                                            |
| `userAgent`     | string   | 500   | no       | -       | -                                                             |
| `severity`      | enum     | -     | no       | `info`  | `info`,`warning`,`critical`                                   |

Notas:

- `actorUserId`: Actor
- `action`: `create`,`update`,`delete`, etc
- `entityType`: `properties`,`reservations`, etc
- `changedFields`: Lista de campos tocados
- `ipHash`: Privacidad

### Indexes

| Index Name                 | Type | Attributes                   | Notes               |
| -------------------------- | ---- | ---------------------------- | ------------------- |
| `idx_activity_actoruserid` | idx  | `actorUserId ↑`              | Auditoria por actor |
| `idx_activity_entitytype`  | idx  | `entityType ↑`               | Filtro entidad      |
| `idx_activity_entityid`    | idx  | `entityId ↑`                 | Historial puntual   |
| `idx_activity_action`      | idx  | `action ↑`                   | Filtro accion       |
| `idx_activity_severity`    | idx  | `severity ↑`                 | Criticidad          |
| `idx_activity_createdat`   | idx  | `$createdAt ↓`               | Timeline            |
| `idx_activity_entitydate`  | idx  | `entityType ↑, $createdAt ↓` | Consulta combinada  |

### Permissions

- Escritura solo por backend/functions.
- Lectura completa solo root via endpoint protegido.

---

## Collection: email_verifications

Purpose: tokens temporales para verificar email.

### Attributes

| Attribute     | Type     | Size | Required | Default | Constraint                |
| ------------- | -------- | ---- | -------- | ------- | ------------------------- |
| `userAuthId`  | string   | 64   | yes      | -       | FK logical a Auth user id |
| `email`       | email    | 254  | yes      | -       | email valido              |
| `token`       | string   | 128  | yes      | -       | unico                     |
| `expireAt`    | datetime | -    | yes      | -       | ISO 8601 UTC, > now       |
| `used`        | boolean  | -    | no       | false   | -                         |
| `invalidated` | boolean  | -    | no       | false   | -                         |

Notas:

- `email`: Objetivo
- `token`: Token de verificacion
- `expireAt`: Vencimiento
- `used`: Ya usado
- `invalidated`: Invalidado por reenvio

### Indexes

| Index Name                        | Type | Attributes                            | Notes              |
| --------------------------------- | ---- | ------------------------------------- | ------------------ |
| `uq_emailverifications_token`     | uq   | `token ↑`                             | Token unico        |
| `idx_emailverifications_userauth` | idx  | `userAuthId ↑`                        | Tokens por usuario |
| `idx_emailverifications_expireat` | idx  | `expireAt ↑`                          | Limpieza           |
| `idx_emailverifications_state`    | idx  | `userAuthId ↑, used ↑, invalidated ↑` | Token activo       |

### Permissions

- Solo system/functions.

---

## Relationships Summary

- `users (1) -> (N) properties`
- `users (1) -> (1) user_preferences`
- `properties (1) -> (N) property_images`
- `properties (1) -> (N) property_amenities`
- `amenities (1) -> (N) property_amenities`
- `properties (1) -> (N) leads`
- `properties (1) -> (N) reservations`
- `reservations (1) -> (N) reservation_payments`
- `reservations (1) -> (1) reservation_vouchers`
- `properties (1) -> (N) reviews`

---

## Migraciones y Versionado

Formato obligatorio:

```md
## Migration: YYYY-MM-DD-description

### Added

### Modified

### Deprecated

### Removed
```

## Migration: 2026-02-10-single-tenant-reservations-audit

### Added

- Colecciones `reservations`, `reservation_payments`, `reservation_vouchers`, `reviews`, `analytics_daily`, `activity_logs`.
- Campos `users.role`, `users.scopesJson`, `users.isHidden`.
- Convencion de atributos completa: size, default, min/max, array.

### Deprecated

- Colecciones `organizations` y `organization_members`.

---

## Estado del Documento

- Definitivo para el schema Appwrite de cada instancia cliente.
- Alineado con reservas, pagos, vouchers, staff y auditoria root.
- Debe mantenerse sincronizado con Appwrite en cada cambio.

---

Ultima actualizacion: 2026-02-10
Version: 2.1.0
Schema Version: 2.1
