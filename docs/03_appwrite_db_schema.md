# 03_APPWRITE_DB_SCHEMA.md - INMOBO PLATFORM

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
- Este documento describe el estado objetivo actual (sin compatibilidad historica).

---

## Convenciones Obligatorias

### Reglas de atributos Appwrite

1. Si `required = yes`, entonces `default` debe ser `-`.
2. Si `default` tiene valor, entonces `required` debe ser `no`.
3. `string` siempre define `size`.
4. `integer` y `float` siempre definen `min` y `max`.
5. Atributos array se documentan en `Type` usando `[]`.
6. Para `string[]`, el `size` aplica a cada elemento.
7. Campos JSON se guardan como `string` serializado con `size` definido.

### Formato de tablas de atributos

| Attribute | Type | Size | Required | Default | Constraint |
| --------- | ---- | ---- | -------- | ------- | ---------- |

### Formato de indices

- Tipos permitidos: `idx` (key), `uq` (unique), `full` (fulltext).
- Direccion: `↑` asc, `↓` desc.

| Index Name | Type | Attributes | Notes |
| ---------- | ---- | ---------- | ----- |

### Campos de sistema Appwrite

Estos campos existen en todos los documentos y no se crean manualmente:

- `$id`
- `$createdAt`
- `$updatedAt`

Regla:

- Indices temporales deben usar `$createdAt` o `$updatedAt`.

### Semantica de ownership

- `ownerUserId` y `resourceOwnerUserId` representan al usuario interno responsable de operacion/permisos.
- No representan propietario legal externo.

---

## Instancia Appwrite

- Endpoint: `https://appwrite.racoondevs.com`
- Version recomendada: `>= 1.8.x`
- Database ID: `mainv2`
- Database Name: `RealEstateClientDB`

---

## Storage Buckets

| Bucket ID         | Purpose                       | Max Size | Public | Extensions        |
| ----------------- | ----------------------------- | -------- | ------ | ----------------- |
| `resource-images` | Imagenes publicas de recursos | 10 MB    | Yes    | jpg,jpeg,png,webp |
| `avatars`         | Avatares de usuarios          | 5 MB     | Yes    | jpg,jpeg,png,webp |
| `documents`       | Contratos y comprobantes      | 20 MB    | No     | pdf,jpg,jpeg,png  |

---

## Collections - Resumen

| Collection ID          | Purpose                                | Phase |
| ---------------------- | -------------------------------------- | ----- |
| `users`                | Perfiles y roles internos + clientes   | 0     |
| `user_preferences`     | Preferencias de UI                     | 0     |
| `resources`            | Catalogo principal de recursos         | 0     |
| `resource_images`      | Galeria por recurso                    | 0     |
| `rate_plans`           | Reglas de pricing y booking            | 0     |
| `amenities`            | Catalogo de amenidades                 | 0     |
| `leads`                | Mensajes/contactos                     | 0     |
| `reservations`         | Reservaciones                          | 0     |
| `reservation_payments` | Intentos/confirmaciones de pago        | 0     |
| `reservation_vouchers` | Voucher emitido por reserva pagada     | 0     |
| `reviews`              | Resenas de clientes                    | 0     |
| `analytics_daily`      | Agregados diarios para dashboard       | 0     |
| `activity_logs`        | Auditoria detallada                    | 0     |
| `email_verifications`  | Tokens de verificacion de correo       | 0     |
| `conversations`        | Hilos de chat cliente-propietario      | 0     |
| `messages`             | Mensajes individuales por conversacion | 0     |
| `instance_settings`    | Configuracion de plan/modulos/limites  | 0     |

---

## Collection: users

Purpose: perfiles de usuarios de la instancia (internos + clientes finales).

### Attributes

| Attribute             | Type     | Size | Required | Default | Constraint                                                             |
| --------------------- | -------- | ---- | -------- | ------- | ---------------------------------------------------------------------- |
| `email`               | email    | 254  | yes      | -       | email valido                                                           |
| `firstName`           | string   | 80   | yes      | -       | min 1                                                                  |
| `lastName`            | string   | 80   | yes      | -       | min 1                                                                  |
| `avatarFileId`        | string   | 64   | no       | -       | FK logical bucket `avatars`                                            |
| `phoneCountryCode`    | string   | 5    | no       | -       | regex `^\+[1-9][0-9]{0,3}$`                                            |
| `phone`               | string   | 15   | no       | -       | regex `^[0-9]{6,15}$`                                                  |
| `whatsappCountryCode` | string   | 5    | no       | -       | regex `^\+[1-9][0-9]{0,3}$`                                            |
| `whatsappNumber`      | string   | 15   | no       | -       | regex `^[0-9]{6,15}$`                                                  |
| `birthDate`           | string   | 10   | no       | -       | regex `^\d{4}-\d{2}-\d{2}$`                                            |
| `lastSeenAt`          | datetime | -    | no       | -       | ISO 8601 UTC                                                           |
| `role`                | enum     | -    | yes      | -       | `root`,`owner`,`staff_manager`,`staff_editor`,`staff_support`,`client` |
| `scopesJson`          | string   | 4000 | no       | -       | JSON array serializado                                                 |
| `isHidden`            | boolean  | -    | no       | false   | -                                                                      |
| `enabled`             | boolean  | -    | no       | true    | -                                                                      |

### Indexes

| Index Name            | Type | Attributes     | Notes                    |
| --------------------- | ---- | -------------- | ------------------------ |
| `uq_users_email`      | uq   | `email ↑`      | Unico por email          |
| `idx_users_role`      | idx  | `role ↑`       | Filtro por rol           |
| `idx_users_hidden`    | idx  | `isHidden ↑`   | Excluir root en listados |
| `idx_users_enabled`   | idx  | `enabled ↑`    | Usuarios activos         |
| `idx_users_createdat` | idx  | `$createdAt ↓` | Orden reciente           |

### Permissions

- Lectura/actualizacion directa: `Role.user($id)`.
- Gestion de staff/roles: solo via Functions (`owner`/`root`).

---

## Collection: user_preferences

Purpose: preferencias de UI por usuario.

### Attributes

| Attribute | Type    | Size | Required | Default  | Constraint              |
| --------- | ------- | ---- | -------- | -------- | ----------------------- |
| `userId`  | string  | 64   | yes      | -        | FK logical `users.$id`  |
| `theme`   | enum    | -    | no       | `system` | `light`,`dark`,`system` |
| `locale`  | enum    | -    | no       | `es`     | `es`,`en`               |
| `enabled` | boolean | -    | no       | true     | -                       |

### Indexes

| Index Name             | Type | Attributes | Notes                   |
| ---------------------- | ---- | ---------- | ----------------------- |
| `uq_userprefs_userid`  | uq   | `userId ↑` | Un registro por usuario |
| `idx_userprefs_locale` | idx  | `locale ↑` | Filtro idioma           |

### Permissions

- `Role.user(userId)` para lectura y escritura.

---

## Collection: resources

Purpose: catalogo principal de recursos comercializables.

### Attributes

| Attribute             | Type     | Size  | Required | Default       | Constraint                                                                             |
| --------------------- | -------- | ----- | -------- | ------------- | -------------------------------------------------------------------------------------- |
| `ownerUserId`         | string   | 64    | yes      | -             | FK logical `users.$id`                                                                 |
| `slug`                | string   | 150   | yes      | -             | regex slug unico                                                                       |
| `title`               | string   | 200   | yes      | -             | min 3                                                                                  |
| `description`         | string   | 5000  | yes      | -             | min 20                                                                                 |
| `resourceType`        | enum     | -     | yes      | -             | `property`,`service`,`vehicle`,`experience`,`venue`                                    |
| `category`            | string   | 80    | yes      | -             | categoria controlada                                                                   |
| `commercialMode`      | enum     | -     | yes      | -             | `sale`,`rent_long_term`,`rent_short_term`,`rent_hourly`                                |
| `pricingModel`        | enum     | -     | no       | `total`       | `total`,`per_month`,`per_night`,`per_day`,`per_hour`,`per_person`,`per_event`,`per_m2` |
| `bookingType`         | enum     | -     | yes      | -             | `manual_contact`,`date_range`,`time_slot`,`fixed_event`                                |
| `attributes`          | string   | 20000 | no       | -             | JSON serializado extensible                                                            |
| `price`               | float    | -     | yes      | -             | min `0`, max `999999999`                                                               |
| `currency`            | enum     | -     | no       | `MXN`         | `MXN`,`USD`,`EUR`                                                                      |
| `priceNegotiable`     | boolean  | -     | no       | false         | -                                                                                      |
| `streetAddress`       | string   | 200   | no       | -             | min 3                                                                                  |
| `neighborhood`        | string   | 100   | no       | -             | min 2                                                                                  |
| `city`                | string   | 100   | yes      | -             | min 2                                                                                  |
| `state`               | string   | 100   | yes      | -             | min 2                                                                                  |
| `country`             | string   | 2     | no       | `MX`          | ISO2                                                                                   |
| `postalCode`          | string   | 10    | no       | -             | regex `^[0-9A-Za-z -]{3,10}$`                                                          |
| `latitude`            | float    | -     | no       | -             | min `-90`, max `90`                                                                    |
| `longitude`           | float    | -     | no       | -             | min `-180`, max `180`                                                                  |
| `bedrooms`            | integer  | -     | no       | 0             | min `0`, max `50`                                                                      |
| `bathrooms`           | float    | -     | no       | 0             | min `0`, max `50`                                                                      |
| `parkingSpaces`       | integer  | -     | no       | 0             | min `0`, max `100`                                                                     |
| `totalArea`           | float    | -     | no       | -             | min `0`, max `999999`                                                                  |
| `builtArea`           | float    | -     | no       | -             | min `0`, max `999999`                                                                  |
| `floors`              | integer  | -     | no       | 1             | min `1`, max `200`                                                                     |
| `yearBuilt`           | integer  | -     | no       | -             | min `1800`, max `2100`                                                                 |
| `maxGuests`           | integer  | -     | no       | 1             | min `1`, max `500`                                                                     |
| `furnished`           | enum     | -     | no       | `unspecified` | `unspecified`,`unfurnished`,`semi_furnished`,`furnished`                               |
| `petsAllowed`         | boolean  | -     | no       | false         | -                                                                                      |
| `rentPeriod`          | enum     | -     | no       | -             | `weekly`,`monthly`,`yearly`                                                            |
| `minStayNights`       | integer  | -     | no       | 1             | min `1`, max `365`                                                                     |
| `maxStayNights`       | integer  | -     | no       | 365           | min `1`, max `365`                                                                     |
| `checkInTime`         | string   | 5     | no       | `15:00`       | regex `^[0-2][0-9]:[0-5][0-9]$`                                                        |
| `checkOutTime`        | string   | 5     | no       | `11:00`       | regex `^[0-2][0-9]:[0-5][0-9]$`                                                        |
| `slotDurationMinutes` | integer  | -     | no       | 60            | min `15`, max `1440`                                                                   |
| `slotBufferMinutes`   | integer  | -     | no       | 0             | min `0`, max `240`                                                                     |
| `videoUrl`            | url      | -     | no       | -             | URL valida                                                                             |
| `virtualTourUrl`      | url      | -     | no       | -             | URL valida                                                                             |
| `galleryImageIds`     | string[] | 64    | no       | -             | max 50 elementos                                                                       |
| `amenities`           | string[] | 64    | no       | -             | slugs de `amenities`                                                                   |
| `status`              | enum     | -     | no       | `draft`       | `draft`,`published`,`inactive`,`archived`                                              |
| `featured`            | boolean  | -     | no       | false         | -                                                                                      |
| `views`               | integer  | -     | no       | 0             | min `0`, max `2147483647`                                                              |
| `contactCount`        | integer  | -     | no       | 0             | min `0`, max `2147483647`                                                              |
| `reservationCount`    | integer  | -     | no       | 0             | min `0`, max `2147483647`                                                              |
| `enabled`             | boolean  | -     | no       | true          | -                                                                                      |

Notas de aplicabilidad por modo comercial:

- `rentPeriod` aplica solo cuando `commercialMode = rent_long_term`.
- Para `rent_short_term`, la periodicidad se define con `pricingModel` (`per_night`/`per_day`) y reglas en `rate_plans`.
- Para `rent_hourly`, la periodicidad se define con `pricingModel` (`per_hour`/`per_event`) y `bookingType` (`time_slot`/`fixed_event`).

### Indexes

| Index Name                   | Type | Attributes               | Notes                  |
| ---------------------------- | ---- | ------------------------ | ---------------------- |
| `uq_resources_slug`          | uq   | `slug ↑`                 | Slug unico             |
| `idx_resources_owneruserid`  | idx  | `ownerUserId ↑`          | Dashboard interno      |
| `idx_resources_status`       | idx  | `status ↑`               | Publicadas/borrador    |
| `idx_resources_city`         | idx  | `city ↑`                 | Filtro geografico      |
| `idx_resources_featured`     | idx  | `featured ↓`             | Destacadas primero     |
| `idx_resources_type`         | idx  | `resourceType ↑`         | Filtro tipo            |
| `idx_resources_mode`         | idx  | `commercialMode ↑`       | Filtro comercial       |
| `idx_resources_bookingtype`  | idx  | `bookingType ↑`          | Filtro booking         |
| `idx_resources_createdat`    | idx  | `$createdAt ↓`           | Recientes              |
| `idx_resources_status_date`  | idx  | `status ↑, $createdAt ↓` | Lista publica paginada |
| `idx_resources_amenities`    | idx  | `amenities`              | Filtro por amenidades  |
| `full_resources_title`       | full | `title`                  | Fulltext titulo        |
| `full_resources_description` | full | `description`            | Fulltext descripcion   |

### Permissions

- Lectura publica solo para `status=published` y `enabled=true`.
- Escritura por owner/staff/root via Functions.

---

## Collection: resource_images

Purpose: metadata de imagen por recurso.

### Attributes

| Attribute    | Type    | Size | Required | Default | Constraint                          |
| ------------ | ------- | ---- | -------- | ------- | ----------------------------------- |
| `resourceId` | string  | 64   | yes      | -       | FK logical `resources.$id`          |
| `fileId`     | string  | 64   | yes      | -       | FK logical bucket `resource-images` |
| `altText`    | string  | 200  | no       | -       | min 3                               |
| `sortOrder`  | integer | -    | no       | 0       | min `0`, max `999`                  |
| `isMain`     | boolean | -    | no       | false   | -                                   |
| `width`      | integer | -    | no       | -       | min `1`, max `10000`                |
| `height`     | integer | -    | no       | -       | min `1`, max `10000`                |
| `enabled`    | boolean | -    | no       | true    | -                                   |

### Indexes

| Index Name                      | Type | Attributes                  | Notes                    |
| ------------------------------- | ---- | --------------------------- | ------------------------ |
| `idx_resourceimages_resourceid` | idx  | `resourceId ↑`              | Imagenes por recurso     |
| `idx_resourceimages_sortorder`  | idx  | `resourceId ↑, sortOrder ↑` | Orden de galeria         |
| `idx_resourceimages_main`       | idx  | `resourceId ↑, isMain ↓`    | Principal                |
| `uq_resourceimages_fileid`      | uq   | `fileId ↑`                  | Un documento por archivo |

### Permissions

- Lectura publica en contexto de recurso publicado.
- Escritura por owner/staff/root via Functions.

---

## Collection: rate_plans

Purpose: pricing y politicas de booking por recurso.

### Attributes

| Attribute            | Type    | Size  | Required | Default    | Constraint                                                                             |
| -------------------- | ------- | ----- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `resourceId`         | string  | 64    | yes      | -          | FK logical `resources.$id`                                                             |
| `name`               | string  | 120   | yes      | -          | min 2                                                                                  |
| `pricingModel`       | enum    | -     | yes      | -          | `total`,`per_month`,`per_night`,`per_day`,`per_hour`,`per_person`,`per_event`,`per_m2` |
| `bookingType`        | enum    | -     | yes      | -          | `manual_contact`,`date_range`,`time_slot`,`fixed_event`                                |
| `basePrice`          | float   | -     | yes      | -          | min `0`, max `999999999`                                                               |
| `currency`           | enum    | -     | no       | `MXN`      | `MXN`,`USD`,`EUR`                                                                      |
| `minQuantity`        | integer | -     | no       | 1          | min `1`, max `9999`                                                                    |
| `maxQuantity`        | integer | -     | no       | 9999       | min `1`, max `9999`                                                                    |
| `minStayNights`      | integer | -     | no       | 1          | min `1`, max `365`                                                                     |
| `maxStayNights`      | integer | -     | no       | 365        | min `1`, max `365`                                                                     |
| `cleaningFee`        | float   | -     | no       | 0          | min `0`, max `999999999`                                                               |
| `serviceFee`         | float   | -     | no       | 0          | min `0`, max `999999999`                                                               |
| `taxRate`            | float   | -     | no       | 0          | min `0`, max `100`                                                                     |
| `depositType`        | enum    | -     | no       | `none`     | `none`,`fixed`,`percent`                                                               |
| `depositAmount`      | float   | -     | no       | 0          | min `0`, max `999999999`                                                               |
| `cancellationPolicy` | enum    | -     | no       | `moderate` | `flexible`,`moderate`,`strict`,`custom`                                                |
| `rulesJson`          | string  | 20000 | no       | -          | JSON serializado                                                                       |
| `enabled`            | boolean | -     | no       | true       | -                                                                                      |

### Indexes

| Index Name                   | Type | Attributes             | Notes                    |
| ---------------------------- | ---- | ---------------------- | ------------------------ |
| `uq_rateplans_resource_name` | uq   | `resourceId ↑, name ↑` | Nombre unico por recurso |
| `idx_rateplans_resourceid`   | idx  | `resourceId ↑`         | Planes por recurso       |
| `idx_rateplans_pricingmodel` | idx  | `pricingModel ↑`       | Filtro modelo            |
| `idx_rateplans_bookingtype`  | idx  | `bookingType ↑`        | Filtro booking           |
| `idx_rateplans_enabled`      | idx  | `enabled ↑`            | Solo activos             |

### Permissions

- Escritura por owner/staff/root via Functions.
- Lectura publica opcional segun politicas de producto.

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

### Indexes

| Index Name               | Type | Attributes   | Notes            |
| ------------------------ | ---- | ------------ | ---------------- |
| `uq_amenities_slug`      | uq   | `slug ↑`     | Unico            |
| `idx_amenities_category` | idx  | `category ↑` | Filtro categoria |
| `idx_amenities_enabled`  | idx  | `enabled ↑`  | Solo activas     |

### Permissions

- Lectura publica de amenidades activas.
- Escritura solo root via Function.

---

## Collection: leads

Purpose: mensajes de contacto del sitio publico.

### Attributes

| Attribute             | Type    | Size | Required | Default | Constraint                                   |
| --------------------- | ------- | ---- | -------- | ------- | -------------------------------------------- |
| `resourceId`          | string  | 64   | yes      | -       | FK logical `resources.$id`                   |
| `resourceOwnerUserId` | string  | 64   | yes      | -       | FK logical `users.$id` (denormalizado)       |
| `name`                | string  | 120  | yes      | -       | min 2                                        |
| `email`               | email   | 254  | yes      | -       | email valido                                 |
| `phone`               | string  | 20   | no       | -       | regex telefono internacional                 |
| `message`             | string  | 2000 | yes      | -       | min 5                                        |
| `status`              | enum    | -    | no       | `new`   | `new`,`contacted`,`closed_won`,`closed_lost` |
| `notes`               | string  | 4000 | no       | -       | notas internas                               |
| `enabled`             | boolean | -    | no       | true    | -                                            |

### Indexes

| Index Name             | Type | Attributes                            | Notes             |
| ---------------------- | ---- | ------------------------------------- | ----------------- |
| `idx_leads_resourceid` | idx  | `resourceId ↑`                        | Leads por recurso |
| `idx_leads_ownerid`    | idx  | `resourceOwnerUserId ↑`               | Inbox por owner   |
| `idx_leads_status`     | idx  | `status ↑`                            | Filtro pipeline   |
| `idx_leads_createdat`  | idx  | `$createdAt ↓`                        | Recientes         |
| `idx_leads_ownerdate`  | idx  | `resourceOwnerUserId ↑, $createdAt ↓` | Dashboard rapido  |

### Permissions

- Creacion publica via Function.
- Lectura/escritura interna por owner/staff con scope de leads.

---

## Collection: reservations

Purpose: reservaciones por recurso.

### Attributes

| Attribute             | Type     | Size | Required | Default   | Constraint                                              |
| --------------------- | -------- | ---- | -------- | --------- | ------------------------------------------------------- |
| `resourceId`          | string   | 64   | yes      | -         | FK logical `resources.$id`                              |
| `resourceOwnerUserId` | string   | 64   | yes      | -         | FK logical `users.$id` (denormalizado)                  |
| `guestUserId`         | string   | 64   | yes      | -         | FK logical `users.$id` del cliente                      |
| `guestName`           | string   | 120  | yes      | -         | min 2                                                   |
| `guestEmail`          | email    | 254  | yes      | -         | email valido                                            |
| `guestPhone`          | string   | 20   | no       | -         | regex telefono internacional                            |
| `commercialMode`      | enum     | -    | yes      | -         | `sale`,`rent_long_term`,`rent_short_term`,`rent_hourly` |
| `bookingType`         | enum     | -    | yes      | -         | `manual_contact`,`date_range`,`time_slot`,`fixed_event` |
| `checkInDate`         | datetime | -    | no       | -         | ISO 8601 UTC                                            |
| `checkOutDate`        | datetime | -    | no       | -         | ISO 8601 UTC, > checkInDate                             |
| `startDateTime`       | datetime | -    | no       | -         | ISO 8601 UTC                                            |
| `endDateTime`         | datetime | -    | no       | -         | ISO 8601 UTC, > startDateTime                           |
| `guestCount`          | integer  | -    | no       | 1         | min `1`, max `500`                                      |
| `units`               | integer  | -    | no       | 1         | min `1`, max `9999`                                     |
| `nights`              | integer  | -    | no       | 0         | min `0`, max `365`                                      |
| `baseAmount`          | float    | -    | yes      | -         | min `0`, max `999999999`                                |
| `feesAmount`          | float    | -    | no       | 0         | min `0`, max `999999999`                                |
| `taxAmount`           | float    | -    | no       | 0         | min `0`, max `999999999`                                |
| `totalAmount`         | float    | -    | yes      | -         | min `0`, max `999999999`                                |
| `currency`            | enum     | -    | no       | `MXN`     | `MXN`,`USD`,`EUR`                                       |
| `status`              | enum     | -    | no       | `pending` | `pending`,`confirmed`,`cancelled`,`completed`,`expired` |
| `paymentStatus`       | enum     | -    | no       | `unpaid`  | `unpaid`,`pending`,`paid`,`failed`,`refunded`           |
| `paymentProvider`     | enum     | -    | no       | `manual`  | `stripe`,`mercadopago`,`manual`                         |
| `externalRef`         | string   | 120  | no       | -         | id externo de reserva/pago                              |
| `specialRequests`     | string   | 2000 | no       | -         | texto libre                                             |
| `enabled`             | boolean  | -    | no       | true      | -                                                       |

### Indexes

| Index Name                       | Type | Attributes                            | Notes                  |
| -------------------------------- | ---- | ------------------------------------- | ---------------------- |
| `idx_reservations_resourceid`    | idx  | `resourceId ↑`                        | Reservas por recurso   |
| `idx_reservations_ownerid`       | idx  | `resourceOwnerUserId ↑`               | Reservas por owner     |
| `idx_reservations_guestuserid`   | idx  | `guestUserId ↑`                       | Reservas por cliente   |
| `idx_reservations_checkin`       | idx  | `checkInDate ↑`                       | Agenda date_range      |
| `idx_reservations_startdatetime` | idx  | `startDateTime ↑`                     | Agenda time_slot/event |
| `idx_reservations_status`        | idx  | `status ↑`                            | Filtro estado          |
| `idx_reservations_paymentstatus` | idx  | `paymentStatus ↑`                     | Filtro pago            |
| `idx_reservations_createdat`     | idx  | `$createdAt ↓`                        | Recientes              |
| `idx_reservations_ownerdate`     | idx  | `resourceOwnerUserId ↑, $createdAt ↓` | Dashboard              |

### Permissions

- Creacion autenticada via Function (`client` verificado).
- Lectura/escritura interna por owner/staff con scope.
- Cliente lee solo su reserva (`guestUserId`).

---

## Collection: reservation_payments

Purpose: ledger de intentos y resultados de pago.

### Attributes

| Attribute             | Type     | Size  | Required | Default   | Constraint                                 |
| --------------------- | -------- | ----- | -------- | --------- | ------------------------------------------ |
| `reservationId`       | string   | 64    | yes      | -         | FK logical `reservations.$id`              |
| `resourceId`          | string   | 64    | yes      | -         | FK logical `resources.$id`                 |
| `resourceOwnerUserId` | string   | 64    | yes      | -         | FK logical `users.$id`                     |
| `provider`            | enum     | -     | yes      | -         | `stripe`,`mercadopago`                     |
| `providerPaymentId`   | string   | 120   | no       | -         | ID de pago externo                         |
| `providerEventId`     | string   | 120   | no       | -         | ID webhook para idempotencia               |
| `amount`              | float    | -     | yes      | -         | min `0`, max `999999999`                   |
| `currency`            | enum     | -     | no       | `MXN`     | `MXN`,`USD`,`EUR`                          |
| `status`              | enum     | -     | no       | `pending` | `pending`,`approved`,`rejected`,`refunded` |
| `rawPayload`          | string   | 20000 | no       | -         | JSON proveedor                             |
| `processedAt`         | datetime | -     | no       | -         | ISO 8601 UTC                               |
| `enabled`             | boolean  | -     | no       | true      | -                                          |

### Indexes

| Index Name                      | Type | Attributes              | Notes                |
| ------------------------------- | ---- | ----------------------- | -------------------- |
| `idx_respayments_reservationid` | idx  | `reservationId ↑`       | Pagos por reserva    |
| `idx_respayments_resourceid`    | idx  | `resourceId ↑`          | Pagos por recurso    |
| `idx_respayments_ownerid`       | idx  | `resourceOwnerUserId ↑` | Dashboard pagos      |
| `idx_respayments_provider`      | idx  | `provider ↑`            | Filtro proveedor     |
| `uq_respayments_eventid`        | uq   | `providerEventId ↑`     | Idempotencia webhook |
| `idx_respayments_status`        | idx  | `status ↑`              | Filtro estado        |
| `idx_respayments_createdat`     | idx  | `$createdAt ↓`          | Recientes            |

### Permissions

- Solo system/functions.
- Lectura por dashboard via endpoint controlado.

---

## Collection: reservation_vouchers

Purpose: comprobante emitido cuando la reserva queda confirmada.

### Attributes

| Attribute             | Type     | Size | Required | Default | Constraint                    |
| --------------------- | -------- | ---- | -------- | ------- | ----------------------------- |
| `reservationId`       | string   | 64   | yes      | -       | FK logical `reservations.$id` |
| `resourceId`          | string   | 64   | yes      | -       | FK logical `resources.$id`    |
| `resourceOwnerUserId` | string   | 64   | yes      | -       | FK logical `users.$id`        |
| `voucherCode`         | string   | 40   | yes      | -       | regex `^[A-Z0-9-]{6,40}$`     |
| `voucherUrl`          | string   | 750  | no       | -       | URL interna o publica         |
| `qrPayload`           | string   | 2000 | no       | -       | JSON/token QR                 |
| `issuedAt`            | datetime | -    | yes      | -       | ISO 8601 UTC                  |
| `sentToEmail`         | email    | 254  | no       | -       | email valido                  |
| `enabled`             | boolean  | -    | no       | true    | -                             |

### Indexes

| Index Name                      | Type | Attributes              | Notes               |
| ------------------------------- | ---- | ----------------------- | ------------------- |
| `uq_resvouchers_code`           | uq   | `voucherCode ↑`         | Codigo unico        |
| `idx_resvouchers_reservationid` | idx  | `reservationId ↑`       | Voucher por reserva |
| `idx_resvouchers_resourceid`    | idx  | `resourceId ↑`          | Voucher por recurso |
| `idx_resvouchers_ownerid`       | idx  | `resourceOwnerUserId ↑` | Dashboard owner     |

### Permissions

- Escritura solo Functions.
- Lectura por owner/staff o endpoint publico por token.

---

## Collection: reviews

Purpose: resenas asociadas a reservas completadas.

### Attributes

| Attribute         | Type     | Size | Required | Default   | Constraint                       |
| ----------------- | -------- | ---- | -------- | --------- | -------------------------------- |
| `resourceId`      | string   | 64   | yes      | -         | FK logical `resources.$id`       |
| `reservationId`   | string   | 64   | yes      | -         | FK logical `reservations.$id`    |
| `authorUserId`    | string   | 64   | yes      | -         | FK logical `users.$id`           |
| `authorName`      | string   | 120  | yes      | -         | min 2                            |
| `authorEmailHash` | string   | 128  | no       | -         | hash sha256/base64               |
| `rating`          | integer  | -    | yes      | -         | min `1`, max `5`                 |
| `title`           | string   | 160  | no       | -         | min 3                            |
| `comment`         | string   | 3000 | yes      | -         | min 10                           |
| `status`          | enum     | -    | no       | `pending` | `pending`,`published`,`rejected` |
| `publishedAt`     | datetime | -    | no       | -         | ISO 8601 UTC                     |
| `enabled`         | boolean  | -    | no       | true      | -                                |

### Indexes

| Index Name                 | Type | Attributes       | Notes               |
| -------------------------- | ---- | ---------------- | ------------------- |
| `idx_reviews_resourceid`   | idx  | `resourceId ↑`   | Resenas por recurso |
| `idx_reviews_authoruserid` | idx  | `authorUserId ↑` | Resenas por cliente |
| `idx_reviews_status`       | idx  | `status ↑`       | Cola moderacion     |
| `idx_reviews_rating`       | idx  | `rating ↓`       | Top rating          |
| `idx_reviews_createdat`    | idx  | `$createdAt ↓`   | Recientes           |

### Permissions

- Creacion autenticada via Function con validacion de reserva elegible.
- Moderacion por owner/staff con scope `reviews.moderate`.

---

## Collection: analytics_daily

Purpose: agregados diarios para dashboard.

### Attributes

| Attribute             | Type     | Size | Required | Default | Constraint                   |
| --------------------- | -------- | ---- | -------- | ------- | ---------------------------- |
| `metricDate`          | datetime | -    | yes      | -       | ISO 8601 UTC, truncado a dia |
| `resourcesPublished`  | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `leadsCreated`        | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `reservationsCreated` | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `paymentsApproved`    | integer  | -    | no       | 0       | min `0`, max `2147483647`    |
| `grossRevenue`        | float    | -    | no       | 0       | min `0`, max `999999999`     |
| `currency`            | enum     | -    | no       | `MXN`   | `MXN`,`USD`,`EUR`            |
| `payloadJson`         | string   | 8000 | no       | -       | JSON serializado             |

### Indexes

| Index Name                | Type | Attributes     | Notes               |
| ------------------------- | ---- | -------------- | ------------------- |
| `uq_analytics_metricdate` | uq   | `metricDate ↑` | Un registro por dia |
| `idx_analytics_createdat` | idx  | `$createdAt ↓` | Recientes           |

### Permissions

- Escritura por Function agregadora.
- Lectura por owner/staff autorizado.

---

## Collection: activity_logs

Purpose: auditoria forense.

### Attributes

| Attribute       | Type     | Size  | Required | Default | Constraint                                                             |
| --------------- | -------- | ----- | -------- | ------- | ---------------------------------------------------------------------- |
| `actorUserId`   | string   | 64    | yes      | -       | FK logical `users.$id`                                                 |
| `actorRole`     | string   | 40    | yes      | -       | `root`,`owner`,`staff_manager`,`staff_editor`,`staff_support`,`client` |
| `action`        | string   | 80    | yes      | -       | verbo de accion                                                        |
| `entityType`    | string   | 80    | yes      | -       | coleccion o dominio                                                    |
| `entityId`      | string   | 64    | no       | -       | ID entidad                                                             |
| `beforeData`    | string   | 20000 | no       | -       | JSON serializado                                                       |
| `afterData`     | string   | 20000 | no       | -       | JSON serializado                                                       |
| `changedFields` | string[] | 120   | no       | -       | max 100 elementos                                                      |
| `changeSummary` | string   | 500   | no       | -       | resumen                                                                |
| `requestId`     | string   | 100   | no       | -       | correlacion                                                            |
| `ipHash`        | string   | 128   | no       | -       | hash no reversible                                                     |
| `userAgent`     | string   | 500   | no       | -       | -                                                                      |
| `severity`      | enum     | -     | no       | `info`  | `info`,`warning`,`critical`                                            |

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

- Escritura solo backend/functions.
- Lectura completa solo root via endpoint protegido.

---

## Collection: email_verifications

Purpose: tokens temporales para verificar email.

### Attributes

| Attribute     | Type     | Size | Required | Default | Constraint           |
| ------------- | -------- | ---- | -------- | ------- | -------------------- |
| `userAuthId`  | string   | 64   | yes      | -       | FK logical Auth user |
| `email`       | email    | 254  | yes      | -       | email valido         |
| `token`       | string   | 128  | yes      | -       | unico                |
| `expireAt`    | datetime | -    | yes      | -       | ISO 8601 UTC, > now  |
| `used`        | boolean  | -    | no       | false   | -                    |
| `invalidated` | boolean  | -    | no       | false   | -                    |

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

## Collection: conversations

Purpose: hilos de chat en tiempo real entre clientes y propietarios/staff.

### Attributes

| Attribute       | Type     | Size | Required | Default  | Constraint                   |
| --------------- | -------- | ---- | -------- | -------- | ---------------------------- |
| `resourceId`    | string   | 64   | yes      | -        | FK logical `resources.$id`   |
| `resourceTitle` | string   | 200  | yes      | -        | Denormalizado para display   |
| `clientUserId`  | string   | 64   | yes      | -        | FK logical `users.$id`       |
| `clientName`    | string   | 120  | yes      | -        | Denormalizado                |
| `ownerUserId`   | string   | 64   | yes      | -        | FK logical `users.$id`       |
| `ownerName`     | string   | 120  | yes      | -        | Denormalizado                |
| `lastMessage`   | string   | 200  | no       | `""`     | Preview truncado             |
| `lastMessageAt` | datetime | -    | no       | -        | ISO 8601 UTC                 |
| `clientUnread`  | integer  | -    | no       | 0        | min `0`, max `9999`          |
| `ownerUnread`   | integer  | -    | no       | 0        | min `0`, max `9999`          |
| `status`        | enum     | -    | no       | `active` | `active`,`archived`,`closed` |
| `enabled`       | boolean  | -    | no       | true     | Soft delete                  |

### Indexes

| Index Name                | Type | Attributes                     | Notes                       |
| ------------------------- | ---- | ------------------------------ | --------------------------- |
| `idx_conv_client`         | idx  | `clientUserId ↑, enabled ↑`    | Conversaciones del cliente  |
| `idx_conv_owner`          | idx  | `ownerUserId ↑, enabled ↑`     | Conversaciones del owner    |
| `idx_conv_resource`       | idx  | `resourceId ↑, enabled ↑`      | Conversaciones por recurso  |
| `idx_conv_lastmsg`        | idx  | `lastMessageAt ↓`              | Orden por ultimo mensaje    |
| `uq_conv_client_resource` | uq   | `clientUserId ↑, resourceId ↑` | Un hilo por cliente-recurso |

### Permissions

**Nivel de coleccion (Appwrite Console):**

- `Role.users("verified")`: create, read, update
- `Role.label("root")`: create, read, update, delete

**Seguridad operacional:**

- Filtros por `clientUserId` / `ownerUserId` en queries.

---

## Collection: messages

Purpose: mensajes individuales dentro de una conversacion.

### Attributes

| Attribute         | Type    | Size | Required | Default | Constraint                      |
| ----------------- | ------- | ---- | -------- | ------- | ------------------------------- |
| `conversationId`  | string  | 64   | yes      | -       | FK logical `conversations.$id`  |
| `senderUserId`    | string  | 64   | yes      | -       | FK logical `users.$id`          |
| `senderName`      | string  | 120  | yes      | -       | Denormalizado                   |
| `senderRole`      | enum    | -    | yes      | -       | `client`,`owner`,`staff`,`root` |
| `body`            | string  | 4000 | yes      | -       | Contenido mensaje               |
| `readBySender`    | boolean | -    | no       | true    | -                               |
| `readByRecipient` | boolean | -    | no       | false   | -                               |
| `enabled`         | boolean | -    | no       | true    | Soft delete                     |

### Indexes

| Index Name             | Type | Attributes                                  | Notes                  |
| ---------------------- | ---- | ------------------------------------------- | ---------------------- |
| `idx_msg_conversation` | idx  | `conversationId ↑, enabled ↑, $createdAt ↑` | Mensajes por hilo      |
| `idx_msg_sender`       | idx  | `senderUserId ↑`                            | Mensajes por remitente |

### Permissions

**Nivel de coleccion (Appwrite Console):**

- `Role.users("verified")`: create, read, update
- `Role.label("root")`: create, read, update, delete

---

## Collection: instance_settings

Purpose: configuracion de la instancia para plan, modulos y limites.

### Attributes

| Attribute        | Type     | Size  | Required | Default | Constraint                        |
| ---------------- | -------- | ----- | -------- | ------- | --------------------------------- |
| `key`            | string   | 40    | yes      | -       | unico; documento principal `main` |
| `planKey`        | string   | 40    | yes      | -       | `starter`,`pro`,`elite`,`custom`  |
| `enabledModules` | string[] | 120   | no       | -       | lista de module keys              |
| `limits`         | string   | 20000 | no       | -       | JSON serializado                  |
| `enabled`        | boolean  | -     | no       | true    | -                                 |

### Indexes

| Index Name                | Type | Attributes | Notes                |
| ------------------------- | ---- | ---------- | -------------------- |
| `uq_instancesettings_key` | uq   | `key ↑`    | Un documento por key |

### Permissions

- Lectura: root y owner segun UI interna.
- Escritura: solo root via Functions/panel root.

---

## Relationships Summary

- `users (1) -> (1) user_preferences`
- `users (1) -> (N) resources`
- `resources (1) -> (N) resource_images`
- `resources (1) -> (N) rate_plans`
- `resources (1) -> (N) leads`
- `resources (1) -> (N) reservations`
- `reservations (1) -> (N) reservation_payments`
- `reservations (1) -> (1) reservation_vouchers`
- `resources (1) -> (N) reviews`
- `users (1) -> (N) conversations` (como `clientUserId`)
- `users (1) -> (N) conversations` (como `ownerUserId`)
- `resources (1) -> (N) conversations`
- `conversations (1) -> (N) messages`

---

## Migraciones y Versionado

Formato obligatorio:

```md
## Migration: YYYY-MM-DD-description

### Added

### Modified

### Removed
```

## Migration: 2026-02-18-resource-only-baseline

### Added

- Colecciones canonicas `resources`, `resource_images`, `rate_plans`, `instance_settings`.
- Llaves foraneas funcionales por `resourceId` en leads, reservas, pagos, reviews y chat.

### Modified

- Catalogo principal y relaciones migradas completamente a `resources`.

### Removed

- Dependencias del catalogo historico y campos de identificacion anteriores en el schema operativo.

---

## Estado del Documento

- Definitivo para el schema Appwrite actual de la instancia.
- Alineado con recursos, reservas, pagos, vouchers, chat, auditoria y modulos por plan.

---

Ultima actualizacion: 2026-02-18
Schema Mode: resource-only
