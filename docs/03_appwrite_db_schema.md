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

### Semantica de ownership (critico)

- `properties.ownerUserId` y campos derivados `propertyOwnerId` representan al usuario interno responsable de operacion/permisos.
- No representan al dueno legal del inmueble.
- En esta plataforma el catalogo interno es compartido por instancia: owner/staff con scope valido deben poder operar sobre todo el catalogo.
- `ownerUserId/propertyOwnerId` no deben usarse como segmentacion obligatoria por usuario en listados internos; se usan para trazabilidad, responsable operativo y analitica.
- Si se necesita modelar dueno legal externo (sin cuenta), debe manejarse como entidad de contacto separada y referenciarse desde `properties`.

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
| `users`                | Perfiles y roles internos + clientes    | 0     |
| `user_preferences`     | Preferencias de UI y branding base      | 0     |
| `properties`           | Catalogo de propiedades                 | 0     |
| `property_images`      | Galeria por propiedad                   | 0     |
| `amenities`            | Catalogo de amenidades                  | 0     |
| `leads`                | Mensajes/contactos                      | 0     |
| `reservations`         | Reservaciones                           | 0     |
| `reservation_payments` | Intentos/confirmaciones de pago         | 0     |
| `reservation_vouchers` | Voucher emitido por reserva pagada      | 0     |
| `reviews`              | Reseñas de clientes                     | 0     |
| `analytics_daily`      | Agregados diarios para dashboard        | 0     |
| `activity_logs`        | Auditoria detallada (panel oculto root) | 0     |
| `email_verifications`  | Tokens de verificacion de correo        | 0     |
| `conversations`        | Hilos de chat cliente-propietario       | 0     |
| `messages`             | Mensajes individuales por conversacion  | 0     |

---

## Collection: users

Purpose: perfiles de usuarios de la instancia (internos + clientes finales).

### Attributes

| Attribute             | Type     | Size | Required | Default | Constraint                                                             |
| --------------------- | -------- | ---- | -------- | ------- | ---------------------------------------------------------------------- |
| `email`               | email    | 254  | yes      | -       | email valido                                                           |
| `firstName`           | string   | 80   | yes      | -       | min 1                                                                  |
| `lastName`            | string   | 80   | yes      | -       | min 1                                                                  |
| `avatarFileId`        | string   | 64   | no       | -       | FK al bucket `avatars`                                                 |
| `phoneCountryCode`    | string   | 5    | no       | -       | regex `^\\+[1-9][0-9]{0,3}$`                                           |
| `phone`               | string   | 15   | no       | -       | regex `^[0-9]{6,15}$` (numero local, sin lada)                         |
| `whatsappCountryCode` | string   | 5    | no       | -       | regex `^\\+[1-9][0-9]{0,3}$`                                           |
| `whatsappNumber`      | string   | 15   | no       | -       | regex `^[0-9]{6,15}$` (numero local, sin lada)                         |
| `birthDate`           | string   | 10   | no       | -       | regex `^\\d{4}-\\d{2}-\\d{2}$`                                         |
| `lastSeenAt`          | datetime | -    | no       | -       | ISO 8601 UTC. Timestamp de ultima actividad para presencia online      |
| `role`                | enum     | -    | yes      | -       | `root`,`owner`,`staff_manager`,`staff_editor`,`staff_support`,`client` |
| `scopesJson`          | string   | 4000 | no       | -       | JSON array serializado                                                 |
| `isHidden`            | boolean  | -    | no       | false   | -                                                                      |
| `enabled`             | boolean  | -    | no       | true    | -                                                                      |

Notas:

- `$id`: Debe ser igual al Auth user id
- `email`: Unico
- `avatarFileId`: FK al bucket `avatars`. Se sincroniza desde `user.prefs.avatarFileId` al subir/actualizar avatar. Permite acceso directo al avatar sin queries adicionales.
- `phoneCountryCode` + `phone`: Telefono principal separado en lada y numero local
- `whatsappCountryCode` + `whatsappNumber`: WhatsApp separado en lada y numero local
- `birthDate`: Fecha de nacimiento en formato `YYYY-MM-DD`
- `lastSeenAt`: Se actualiza cada 30s mediante heartbeat desde el cliente. Si (now - lastSeenAt) < 60s, el usuario se considera "online".
- `role`: Rol de aplicacion
- `scopesJson`: Permisos finos
- `isHidden`: `true` para root
- `client`: rol por defecto para registros web publicos
- `enabled`: Soft delete

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
- Gestion de staff/roles: solo via Functions (owner/root).
- Listado de clientes por owner: solo via Function y sin mutaciones directas.

---

## Collection: user_preferences

Purpose: preferencias de UI por usuario.

### Attributes

| Attribute | Type    | Size | Required | Default  | Constraint               |
| --------- | ------- | ---- | -------- | -------- | ------------------------ |
| `userId`  | string  | 64   | yes      | -        | FK logical a `users.$id` |
| `theme`   | enum    | -    | no       | `system` | `light`,`dark`,`system`  |
| `locale`  | enum    | -    | no       | `es`     | `es`,`en`                |
| `enabled` | boolean | -    | no       | true     | -                        |

Notas:

- `userId`: Un registro por usuario
- `theme`: Tema visual de la interfaz
- `locale`: Idioma preferido

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
| `ownerUserId`      | string   | 64   | yes      | -       | FK logical a `users.$id` (responsable interno)               |
| `slug`             | string   | 150  | yes      | -       | regex slug unico                                             |
| `title`            | string   | 200  | yes      | -       | min 3                                                        |
| `description`      | string   | 5000 | yes      | -       | min 20                                                       |
| `propertyType`     | enum     | -    | yes      | -       | `house`,`apartment`,`land`,`commercial`,`office`,`warehouse` |
| `operationType`    | enum     | -    | yes      | -       | `sale`,`rent`,`vacation_rental`                              |
| `price`            | float    | -    | yes      | -       | min `0`, max `999999999`                                     |
| `currency`         | enum     | -    | no       | `MXN`   | `MXN`,`USD`,`EUR`                                            |
| `pricePerUnit`     | enum     | -    | no       | `total` | `total`,`sqm`,`sqft`                                         |
| `priceNegotiable`  | boolean  | -    | no       | false   | -                                                            |
| `streetAddress`    | string   | 200  | no       | -       | min 3                                                        |
| `neighborhood`     | string   | 100  | no       | -       | min 2                                                        |
| `city`             | string   | 100  | yes      | -       | min 2                                                        |
| `state`            | string   | 100  | yes      | -       | min 2                                                        |
| `country`          | string   | 2    | no       | `MX`    | ISO2                                                         |
| `postalCode`       | string   | 10   | no       | -       | regex `^[0-9A-Za-z -]{3,10}$`                                |
| `latitude`         | float    | -    | no       | -       | min `-90`, max `90`                                          |
| `longitude`        | float    | -    | no       | -       | min `-180`, max `180`                                        |
| `bedrooms`         | integer  | -    | no       | 0       | min `0`, max `50`                                            |
| `bathrooms`        | float    | -    | no       | 0       | min `0`, max `50`                                            |
| `parkingSpaces`    | integer  | -    | no       | 0       | min `0`, max `100`                                           |
| `totalArea`        | float    | -    | no       | -       | min `0`, max `999999`                                        |
| `builtArea`        | float    | -    | no       | -       | min `0`, max `999999`                                        |
| `floors`           | integer  | -    | no       | 1       | min `1`, max `200`                                           |
| `yearBuilt`        | integer  | -    | no       | -       | min `1800`, max `2100`                                       |
| `maxGuests`        | integer  | -    | no       | 0       | min `1`, max `500`                                           |
| `furnished`        | enum     | -    | no       | -       | `unfurnished`,`semi_furnished`,`furnished`                   |
| `petsAllowed`      | boolean  | -    | no       | false   | -                                                            |
| `rentPeriod`       | enum     | -    | no       | -       | `monthly`,`yearly`,`weekly`                                  |
| `minStayNights`    | integer  | -    | no       | 1       | min `1`, max `365`                                           |
| `maxStayNights`    | integer  | -    | no       | 365     | min `1`, max `365`                                           |
| `checkInTime`      | string   | 5    | no       | `15:00` | regex `^[0-2][0-9]:[0-5][0-9]$`                              |
| `checkOutTime`     | string   | 5    | no       | `11:00` | regex `^[0-2][0-9]:[0-5][0-9]$`                              |
| `videoUrl`         | URL      | -    | no       | -       | URL valida                                                   |
| `virtualTourUrl`   | URL      | -    | no       | -       | URL valida                                                   |
| `galleryImageIds`  | string[] | 64   | no       | -       | max 50 elementos, cada elemento size 64                      |
| `amenities`        | string[] | 64   | no       | -       | Slugs de amenidades del catalogo `amenities`                 |
| `status`           | enum     | -    | no       | `draft` | `draft`,`published`,`inactive`,`archived`                    |
| `featured`         | boolean  | -    | no       | false   | -                                                            |
| `views`            | integer  | -    | no       | 0       | min `0`, max `2147483647`                                    |
| `contactCount`     | integer  | -    | no       | 0       | min `0`, max `2147483647`                                    |
| `reservationCount` | integer  | -    | no       | 0       | min `0`, max `2147483647`                                    |
| `enabled`          | boolean  | -    | no       | true    | -                                                            |

Notas:

- `ownerUserId`: Usuario interno responsable (owner/staff). No es dueno legal del inmueble
- `slug`: URL publica
- `price`: Precio base
- `pricePerUnit`: Indica si el precio es total, por m² o por ft²
- `priceNegotiable`: Indica si el precio es negociable
- `streetAddress`: Direccion (calle y numero)
- `neighborhood`: Colonia o barrio
- `postalCode`: Codigo postal
- `latitude` / `longitude`: Coordenadas GPS para mapa
- `bathrooms`: Permite medios banos
- `parkingSpaces`: Espacios de estacionamiento
- `totalArea`: Area total del terreno en m²
- `builtArea`: Area construida en m²
- `floors`: Numero de pisos/niveles
- `yearBuilt`: Ano de construccion
- `maxGuests`: Capacidad maxima (relevante para vacation_rental)
- `furnished`: Estado de amueblado (relevante para rent/vacation_rental)
- `petsAllowed`: Si se permiten mascotas (relevante para rent/vacation_rental)
- `rentPeriod`: Periodo de renta (relevante para rent: mensual, anual, semanal)
- `minStayNights` / `maxStayNights`: Estancia minima/maxima en noches (relevante para vacation_rental)
- `checkInTime` / `checkOutTime`: Hora de check-in/check-out (relevante para vacation_rental)
- `videoUrl`: URL de video (YouTube, Vimeo, etc.)
- `virtualTourUrl`: URL de tour virtual 360
- `galleryImageIds`: `string[]` para lista rapida de file IDs
- `amenities`: Array de slugs de amenidades. Permite filtros eficientes con `Query.contains()`. Se guarda directamente en el array al crear/editar propiedad.
- `views`: Contador
- `contactCount`: Contador
- `reservationCount`: Contador
- `enabled`: Soft delete

### Relevancia de campos por tipo de operacion

| Campo           | sale | rent | vacation_rental |
| --------------- | ---- | ---- | --------------- |
| `bedrooms`      | si   | si   | si              |
| `bathrooms`     | si   | si   | si              |
| `parkingSpaces` | si   | si   | si              |
| `totalArea`     | si   | si   | opcional        |
| `builtArea`     | si   | si   | opcional        |
| `floors`        | si   | si   | no              |
| `yearBuilt`     | si   | si   | no              |
| `maxGuests`     | no   | no   | si              |
| `furnished`     | no   | si   | si              |
| `petsAllowed`   | no   | si   | si              |
| `rentPeriod`    | no   | si   | no              |
| `minStayNights` | no   | no   | si              |
| `maxStayNights` | no   | no   | si              |
| `checkInTime`   | no   | no   | si              |
| `checkOutTime`  | no   | no   | si              |

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
| `full_title_search`          | full | `title`                  | Fulltext titulo        |
| `full_description_search`    | full | `description`            | Fulltext descripcion   |
| `idx_properties_amenities`   | idx  | `amenities`              | Filtro por amenidades  |

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

## Collection: leads

Purpose: mensajes de contacto del sitio publico.

### Attributes

| Attribute         | Type    | Size | Required | Default | Constraint                                   |
| ----------------- | ------- | ---- | -------- | ------- | -------------------------------------------- |
| `propertyId`      | string  | 64   | yes      | -       | FK logical a `properties.$id`                |
| `propertyOwnerId` | string  | 64   | yes      | -       | FK logical a `users.$id` (denormalizado)     |
| `name`            | string  | 120  | yes      | -       | min 2                                        |
| `email`           | email   | 254  | yes      | -       | email valido                                 |
| `phone`           | string  | 20   | no       | -       | regex telefono internacional                 |
| `message`         | string  | 2000 | yes      | -       | min 5                                        |
| `status`          | enum    | -    | no       | `new`   | `new`,`contacted`,`closed_won`,`closed_lost` |
| `notes`           | string  | 4000 | no       | -       | -                                            |
| `enabled`         | boolean | -    | no       | true    | -                                            |

Notas:

- `propertyOwnerId`: Copia de `properties.ownerUserId` para permisos/filtros (no dueno legal)
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
| `propertyOwnerId` | string   | 64   | yes      | -         | FK logical a `users.$id` (denormalizado)                |
| `guestUserId`     | string   | 64   | yes      | -         | FK logical a Auth/App `users.$id` del cliente           |
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
- `guestUserId`: Usuario autenticado que crea la reserva
- `propertyOwnerId`: Copia de `properties.ownerUserId` para permisos/filtros (no dueno legal)
- `enabled`: Soft delete

### Indexes

| Index Name                       | Type | Attributes                        | Notes                  |
| -------------------------------- | ---- | --------------------------------- | ---------------------- |
| `idx_reservations_propertyid`    | idx  | `propertyId ↑`                    | Reservas por propiedad |
| `idx_reservations_ownerid`       | idx  | `propertyOwnerId ↑`               | Reservas por owner     |
| `idx_reservations_guestuserid`   | idx  | `guestUserId ↑`                   | Reservas por cliente   |
| `idx_reservations_checkin`       | idx  | `checkInDate ↑`                   | Agenda                 |
| `idx_reservations_status`        | idx  | `status ↑`                        | Filtro de estado       |
| `idx_reservations_paymentstatus` | idx  | `paymentStatus ↑`                 | Filtro de pago         |
| `idx_reservations_createdat`     | idx  | `$createdAt ↓`                    | Recientes              |
| `idx_reservations_ownerdate`     | idx  | `propertyOwnerId ↑, $createdAt ↓` | Dashboard              |

### Permissions

- Creacion autenticada via Function (cliente registrado + email verificado).
- Lectura/escritura para owner/staff con scope de reservas.
- Lectura de propia reserva para `Role.user(guestUserId)`.

---

## Collection: reservation_payments

Purpose: ledger de intentos y resultados de pago.

### Attributes

| Attribute           | Type     | Size  | Required | Default   | Constraint                                 |
| ------------------- | -------- | ----- | -------- | --------- | ------------------------------------------ |
| `reservationId`     | string   | 64    | yes      | -         | FK logical a `reservations.$id`            |
| `propertyOwnerId`   | string   | 64    | yes      | -         | FK logical a `users.$id` (denormalizado)   |
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

- `propertyOwnerId`: Copia de `reservations.propertyOwnerId` para dashboard y permisos

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

| Attribute         | Type     | Size | Required | Default | Constraint                               |
| ----------------- | -------- | ---- | -------- | ------- | ---------------------------------------- |
| `reservationId`   | string   | 64   | yes      | -       | FK logical a `reservations.$id`          |
| `propertyOwnerId` | string   | 64   | yes      | -       | FK logical a `users.$id` (denormalizado) |
| `voucherCode`     | string   | 40   | yes      | -       | regex `^[A-Z0-9-]{6,40}$`                |
| `voucherUrl`      | string   | 750  | no       | -       | URL interna o publica                    |
| `qrPayload`       | string   | 2000 | no       | -       | JSON o token para QR                     |
| `issuedAt`        | datetime | -    | yes      | -       | ISO 8601 UTC                             |
| `sentToEmail`     | email    | 254  | no       | -       | email valido                             |
| `enabled`         | boolean  | -    | no       | true    | -                                        |

Notas:

- `voucherCode`: Unico
- `voucherUrl`: PDF/web
- `propertyOwnerId`: Copia de `reservations.propertyOwnerId` para dashboard y permisos

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

Purpose: reseñas asociadas a reservas completadas.

### Attributes

| Attribute         | Type     | Size | Required | Default   | Constraint                        |
| ----------------- | -------- | ---- | -------- | --------- | --------------------------------- |
| `propertyId`      | string   | 64   | yes      | -         | FK logical a `properties.$id`     |
| `reservationId`   | string   | 64   | yes      | -         | FK logical a `reservations.$id`   |
| `authorUserId`    | string   | 64   | yes      | -         | FK logical a Auth/App `users.$id` |
| `authorName`      | string   | 120  | yes      | -         | min 2                             |
| `authorEmailHash` | string   | 128  | no       | -         | hash sha256/base64                |
| `rating`          | integer  | -    | yes      | -         | min `1`, max `5`                  |
| `title`           | string   | 160  | no       | -         | min 3                             |
| `comment`         | string   | 3000 | yes      | -         | min 10                            |
| `status`          | enum     | -    | no       | `pending` | `pending`,`published`,`rejected`  |
| `publishedAt`     | datetime | -    | no       | -         | ISO 8601 UTC                      |
| `enabled`         | boolean  | -    | no       | true      | -                                 |

Notas:

- `reservationId`: Elegibilidad
- `authorUserId`: Usuario autenticado que envia la reseña
- `authorName`: Publico
- `authorEmailHash`: Anti abuso
- `status`: Moderacion
- `enabled`: Soft delete

### Indexes

| Index Name                 | Type | Attributes       | Notes                 |
| -------------------------- | ---- | ---------------- | --------------------- |
| `idx_reviews_propertyid`   | idx  | `propertyId ↑`   | Reseñas por propiedad |
| `idx_reviews_authoruserid` | idx  | `authorUserId ↑` | Reseñas por cliente   |
| `idx_reviews_status`       | idx  | `status ↑`       | Cola de moderacion    |
| `idx_reviews_rating`       | idx  | `rating ↓`       | Top rating            |
| `idx_reviews_createdat`    | idx  | `$createdAt ↓`   | Recientes             |

### Permissions

- Creacion autenticada via Function con validacion de reserva y usuario.
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

| Attribute       | Type     | Size  | Required | Default | Constraint                                                             |
| --------------- | -------- | ----- | -------- | ------- | ---------------------------------------------------------------------- |
| `actorUserId`   | string   | 64    | yes      | -       | FK logical a `users.$id`                                               |
| `actorRole`     | string   | 40    | yes      | -       | `root`,`owner`,`staff_manager`,`staff_editor`,`staff_support`,`client` |
| `action`        | string   | 80    | yes      | -       | verbo de accion                                                        |
| `entityType`    | string   | 80    | yes      | -       | nombre coleccion o dominio                                             |
| `entityId`      | string   | 64    | no       | -       | ID de entidad                                                          |
| `beforeData`    | string   | 20000 | no       | -       | JSON serializado antes del cambio                                      |
| `afterData`     | string   | 20000 | no       | -       | JSON serializado despues del cambio                                    |
| `changedFields` | string[] | 120   | no       | -       | max 100 elementos                                                      |
| `changeSummary` | string   | 500   | no       | -       | resumen corto                                                          |
| `requestId`     | string   | 100   | no       | -       | correlacion                                                            |
| `ipHash`        | string   | 128   | no       | -       | hash no reversible                                                     |
| `userAgent`     | string   | 500   | no       | -       | -                                                                      |
| `severity`      | enum     | -     | no       | `info`  | `info`,`warning`,`critical`                                            |

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

## Collection: conversations

Purpose: hilos de chat en tiempo real entre clientes y propietarios/staff.

### Attributes

| Attribute       | Type     | Size | Required | Default  | Constraint                                                     |
| --------------- | -------- | ---- | -------- | -------- | -------------------------------------------------------------- |
| `propertyId`    | string   | 64   | yes      | -        | FK logical a `properties.$id`                                  |
| `propertyTitle` | string   | 200  | yes      | -        | Denormalizado para display                                     |
| `clientUserId`  | string   | 64   | yes      | -        | FK logical a `users.$id` (cliente que inicio)                  |
| `clientName`    | string   | 120  | yes      | -        | Denormalizado                                                  |
| `ownerUserId`   | string   | 64   | yes      | -        | FK logical a `users.$id` (propietario/manager de la propiedad) |
| `ownerName`     | string   | 120  | yes      | -        | Denormalizado                                                  |
| `lastMessage`   | string   | 200  | no       | `""`     | Preview truncado del ultimo mensaje                            |
| `lastMessageAt` | datetime | -    | no       | -        | ISO 8601 UTC, timestamp del ultimo mensaje                     |
| `clientUnread`  | integer  | -    | no       | 0        | min 0, max 9999. Contador no leidos para el cliente            |
| `ownerUnread`   | integer  | -    | no       | 0        | min 0, max 9999. Contador no leidos para el propietario        |
| `status`        | enum     | -    | no       | `active` | `active`, `archived`, `closed`                                 |
| `enabled`       | boolean  | -    | no       | true     | Soft delete                                                    |

Notas:

- Un hilo por combinacion unica `clientUserId` + `propertyId` (indice unique).
- `lastMessage` y `lastMessageAt` se actualizan al enviar cada mensaje para optimizar listados sin queries adicionales.
- `clientUnread`/`ownerUnread` se incrementan al recibir mensaje y se resetean al leer.
- Campos denormalizados (`propertyTitle`, `clientName`, `ownerName`) evitan lookups en listados.
- Los avatares se obtienen desde `users.avatarFileId` usando `clientUserId`/`ownerUserId` - no se desnormalizan.

### Indexes

| Index Name                | Type | Attributes                     | Notes                            |
| ------------------------- | ---- | ------------------------------ | -------------------------------- |
| `idx_conv_client`         | idx  | `clientUserId ↑, enabled ↑`    | Conversaciones de un cliente     |
| `idx_conv_owner`          | idx  | `ownerUserId ↑, enabled ↑`     | Conversaciones de un propietario |
| `idx_conv_property`       | idx  | `propertyId ↑, enabled ↑`      | Conversaciones por propiedad     |
| `idx_conv_lastmsg`        | idx  | `lastMessageAt ↓`              | Orden por ultimo mensaje         |
| `uq_conv_client_property` | uq   | `clientUserId ↑, propertyId ↑` | Un hilo por cliente-propiedad    |

### Permissions

**Nivel de colección (configurar en Appwrite Console):**

- `Role.users("verified")`: create, read, update (usuarios verificados pueden crear, leer y actualizar conversaciones)
- `Role.label("root")`: create, read, update, delete (root tiene control total)

**Nivel de documento:**

Al crear documentos desde el cliente, solo se otorgan permisos al creador (`Role.user(clientUserId)`). La seguridad se garantiza mediante:

1. **Query filters**: Los usuarios solo consultan conversaciones donde son `clientUserId` o `ownerUserId`.
2. **Collection-level permissions**: Permiten que ambas partes (client/owner) lean y actualicen documentos.

**Nota**: No se puede otorgar permisos a otros usuarios desde el cliente debido a restricciones de seguridad de Appwrite. El owner accede a la conversación a través de los permisos de colección + filtros de query por `ownerUserId`.

---

## Collection: messages

Purpose: mensajes individuales dentro de una conversacion.

### Attributes

| Attribute         | Type    | Size | Required | Default | Constraint                         |
| ----------------- | ------- | ---- | -------- | ------- | ---------------------------------- |
| `conversationId`  | string  | 64   | yes      | -       | FK logical a `conversations.$id`   |
| `senderUserId`    | string  | 64   | yes      | -       | FK logical a `users.$id`           |
| `senderName`      | string  | 120  | yes      | -       | Denormalizado                      |
| `senderRole`      | enum    | -    | yes      | -       | `client`, `owner`, `staff`, `root` |
| `body`            | string  | 4000 | yes      | -       | Contenido del mensaje              |
| `readBySender`    | boolean | -    | no       | true    | -                                  |
| `readByRecipient` | boolean | -    | no       | false   | -                                  |
| `enabled`         | boolean | -    | no       | true    | Soft delete                        |

Notas:

- Los mensajes heredan permisos de la conversacion padre.
- `senderRole` se determina al momento de enviar segun el rol del usuario en `users.role`.
- `readByRecipient` se marca `true` cuando el destinatario abre la conversacion.
- `body` soporta hasta 4000 caracteres de texto plano.

### Indexes

| Index Name             | Type | Attributes                                  | Notes                  |
| ---------------------- | ---- | ------------------------------------------- | ---------------------- |
| `idx_msg_conversation` | idx  | `conversationId ↑, enabled ↑, $createdAt ↑` | Mensajes por hilo      |
| `idx_msg_sender`       | idx  | `senderUserId ↑`                            | Mensajes por remitente |

### Permissions

**Nivel de colección (configurar en Appwrite Console):**

- `Role.users("verified")`: create, read, update (usuarios verificados pueden crear, leer y actualizar mensajes)
- `Role.label("root")`: create, read, update, delete (root tiene control total)

**Nivel de documento:**

Los mensajes no requieren permisos explícitos a nivel de documento. La seguridad se garantiza mediante:

1. **Query filters**: Los usuarios solo consultan mensajes donde el `conversationId` corresponde a una conversación a la que tienen acceso.
2. **Collection-level permissions**: Permiten que los participantes de la conversación lean y creen mensajes.

**Nota**: La seguridad se basa en que los usuarios solo conocen/acceden a `conversationId` de conversaciones donde son participantes (client o owner).

---

## Relationships Summary

- `users (1) -> (N) properties`
- `users (1) -> (1) user_preferences`
- `users (1) -> (N) reservations` (como `guestUserId`)
- `users (1) -> (N) reviews` (como `authorUserId`)
- `properties (1) -> (N) property_images`
- `properties (1) -> (N) leads`
- `properties (1) -> (N) reservations`
- `reservations (1) -> (N) reservation_payments`
- `reservations (1) -> (1) reservation_vouchers`
- `properties (1) -> (N) reviews`
- `users (1) -> (N) conversations` (como `clientUserId`)
- `users (1) -> (N) conversations` (como `ownerUserId`)
- `properties (1) -> (N) conversations`
- `conversations (1) -> (N) messages`

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

## Migration: 2026-02-11-client-auth-booking-review

### Added

- Rol `client` en `users.role`.
- Campo `reservations.guestUserId`.
- Campo `reviews.authorUserId`.
- Indexes `idx_reservations_guestuserid` y `idx_reviews_authoruserid`.

### Modified

- `create-reservation-public`, `create-payment-session` y `create-review-public` pasan a flujo autenticado para clientes registrados.
- `activity_logs.actorRole` agrega `client`.

## Migration: 2026-02-12-ownership-semantics-clarification

### Modified

- Se aclara semantica: `ownerUserId`/`propertyOwnerId` = usuario interno responsable (operacion/permisos), no dueno legal del inmueble.
- Se documenta que el dueno legal externo debe modelarse como entidad de contacto separada y referenciarse desde `properties`.
- Se aclara que el catalogo interno es compartido por instancia y que `ownerUserId/propertyOwnerId` no deben forzar segmentacion de visibilidad por usuario.

## Migration: 2026-02-15-split-fulltext-indexes

### Removed

- Indice compuesto `full_properties_search` (fulltext en `title,description`). Appwrite 1.8.x no soporta `Query.search()` sobre atributos individuales en indices fulltext compuestos.

### Added

- Indice `full_title_search` (fulltext en `title`). Busqueda por titulo.
- Indice `full_description_search` (fulltext en `description`). Busqueda por descripcion.

## Migration: 2026-02-15-simplify-amenities-to-array

### Added

- Campo `properties.amenities` (string[], size 64). Array de slugs de amenidades.
- Indice `idx_properties_amenities` para filtros con `Query.contains()`.

### Removed

- Coleccion `property_amenities` (junction table many-to-many).
- Indices: `uq_propamen_combo`, `idx_propamen_propertyid`, `idx_propamen_amenityid`.

### Rationale

- Appwrite no soporta JOINs.
- Mantener `property_amenities` + `properties.amenities[]` crea redundancia y requiere sincronizacion constante.
- Simplificar a solo array en `properties` es mas mantenible y permite filtros eficientes.
- El wizard/forms se actualizan para guardar directamente en el array.

### Manual Steps

1. En Appwrite Console, abrir coleccion `properties`
2. Agregar atributo:
   - Name: `amenities`
   - Type: `String[]`
   - Size: `64`
   - Required: `No`
   - Array: `Yes`
3. Crear indice:
   - Name: `idx_properties_amenities`
   - Type: `index`
   - Attributes: `amenities`
4. **ELIMINAR** coleccion `property_amenities` completamente
5. Migrar datos existentes: copiar amenity slugs desde `property_amenities` a `properties.amenities[]` antes de eliminar
6. Actualizar wizard/forms en frontend para guardar directamente en array

---

## Migration: 2026-02-16-chat-messaging-collections

### Added

- Coleccion `conversations`: hilos de chat entre clientes y propietarios con contadores de no leidos, preview de ultimo mensaje y estado.
- Coleccion `messages`: mensajes individuales dentro de una conversacion con roles de remitente y estados de lectura.
- Indices: `idx_conv_client`, `idx_conv_owner`, `idx_conv_property`, `idx_conv_lastmsg`, `uq_conv_client_property`, `idx_msg_conversation`, `idx_msg_sender`.
- Variables de entorno: `APPWRITE_COLLECTION_CONVERSATIONS_ID`, `APPWRITE_COLLECTION_MESSAGES_ID`.
- Function: `send-chat-notification` para notificaciones por email cuando el destinatario esta offline.
- Relaciones: `users -> conversations`, `properties -> conversations`, `conversations -> messages`.

---

## Migration: 2026-02-17-chat-collection-level-permissions

### Modified

- **conversations** y **messages**: Se modificaron los permisos de documento-level a **collection-level**.
- Razón: Appwrite no permite que un usuario otorgue permisos a otros usuarios desde el cliente. Solo puede otorgar permisos a sí mismo.
- Solución: Configurar permisos a nivel de colección (`Role.users("verified")`) para create/read/update, y usar filtros de query (`clientUserId`, `ownerUserId`) para seguridad.

### Manual Steps to Fix

**En Appwrite Console:**

1. Abrir colección `conversations` → Settings → Permissions
2. Agregar a nivel de colección:
   - `Role.users("verified")`: ✅ Create, ✅ Read, ✅ Update
   - `Role.label("root")`: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
3. Abrir colección `messages` → Settings → Permissions
4. Agregar a nivel de colección:
   - `Role.users("verified")`: ✅ Create, ✅ Read, ✅ Update
   - `Role.label("root")`: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
5. **NO ES NECESARIO** configurar permisos a nivel de documento — el código del cliente solo otorga permisos al creador.

**Seguridad garantizada por:**

- Query filters: usuarios solo consultan conversaciones donde son `clientUserId` o `ownerUserId`
- Queries con `Query.equal("clientUserId", user.$id)` o `Query.equal("ownerUserId", user.$id)`

---

## Migration: 2026-02-17-users-avatar-field

### Added

- **users**: Se agregó campo `avatarFileId` como single source of truth para avatares.
- Razón: Eliminar duplicación. En lugar de denormalizar avatares en múltiples colecciones, se centraliza en `users` y se sincroniza desde `user.prefs.avatarFileId`.
- Tipo: string (64), opcional, default vacío
- FK al bucket `avatars`

### Modified

- **conversations**: Se eliminan campos `clientAvatarFileId` y `ownerAvatarFileId` (si existen). Los avatares se obtienen desde `users.avatarFileId`.
- **Bucket avatars**: Cambiar a Public: Yes para permitir lectura con fileId.

### Manual Steps to Fix

**En Appwrite Console:**

1. Abrir colección `users` → Attributes
2. Agregar nuevo atributo:
   - Key: `avatarFileId`
   - Type: String
   - Size: 64
   - Required: No
   - Default: vacío
3. Abrir Storage → Bucket `avatars` → Settings
4. Cambiar **File Security**: Activar "Public" para permitir lectura con fileId
5. Si ya existen campos `clientAvatarFileId` y `ownerAvatarFileId` en `conversations`, eliminarlos.
6. **Sincronización**: Ejecutar script para copiar `user.prefs.avatarFileId` → `users.avatarFileId` para usuarios existentes.

---

## Migration: 2026-02-16-users-online-presence

### Added

- **users**: Se agregó campo `lastSeenAt` para sistema de presencia online en tiempo real.
- Purpose: Permitir indicar si un usuario está "online" en el chat mediante heartbeat cada 30s.
- Tipo: datetime, opcional, default vacío
- Lógica: Si `(now - lastSeenAt) < 60s` → usuario está online. Frontend actualiza mediante heartbeat cada 30s.

### Manual Steps to Fix

**En Appwrite Console:**

1. Abrir colección `users` → Attributes
2. Agregar nuevo atributo:
   - Key: `lastSeenAt`
   - Type: DateTime
   - Required: No
   - Default: vacío
3. No requiere índice adicional (se usa solo para lectura directa en perfil de contacto)

**En el Frontend:**

- El hook `usePresence` actualiza `lastSeenAt` cada 30s mientras el usuario esté autenticado
- El helper `isUserOnline(lastSeenAt)` determina si está online basado en timestamp
- Se muestra indicador verde en header de conversación si el contacto está online

---

## Estado del Documento

- Definitivo para el schema Appwrite de cada instancia cliente.
- Alineado con reservas, pagos, vouchers, staff, clientes autenticados, auditoria root, chat en tiempo real y presencia online.
- Debe mantenerse sincronizado con Appwrite en cada cambio.

---

Ultima actualizacion: 2026-02-16
Version: 2.6.0
Schema Version: 2.7
