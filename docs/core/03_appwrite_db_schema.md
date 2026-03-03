# 03_APPWRITE_DB_SCHEMA - APPWRITE 1.8.1 CANON

## Referencias

- `00_ai_project_context.md`
- `02_backend_appwrite_requirements.md`
- `05_permissions_and_roles.md`
- `06_appwrite_functions_catalog.md`
- `09_appwrite_platform_limits.md`

---

## 1) Scope

Source of truth for Appwrite database schema in one customer instance.

- Endpoint: `https://appwrite.racoondevs.com`
- Database ID: `main`
- Schema mode: `resource-first`

This doc is concise-by-design for AI usage.
Migration history belongs in `docs/migrations/*`.

---

## 2) Platform constraints (mandatory)

All IDs, keys, types, and indexes in this schema must comply with:

- `09_appwrite_platform_limits.md`

Hard budgets used here:

- ID fields (`databaseId`, `collectionId`, `functionId`, `bucketId`): `<=36`
- Attribute keys: `<=32`
- Index names: `<=36`

Key style decision:

- Existing operational keys remain canonical.
- New keys must use `snake_case`.

Type usage rules:

- Canon types used by this project: `string`, `integer`, `float`, `boolean`, `datetime`, `enum`, `email`, `url`, `ip`, `relationship`.
- `string` fields must always define max length.
- Typed fields (`email`, `url`, `ip`) are documented as typed attributes, not as generic strings.

---

## 3) Index design rules (project-specific)

1. Prefer single-field indexes.
2. Composite indexes only for proven query patterns (max 2 fields in most cases).
3. Avoid composite indexes on long strings.
4. Unique indexes only for strict uniqueness requirements.
5. Keep index names short (`idx_<entity>_<field>`, `uq_<entity>_<field>`).

---

## 4) Storage buckets

| Bucket ID         | Purpose                 | Max size | Public |
| ----------------- | ----------------------- | -------- | ------ |
| `resource-images` | resource gallery images | 10 MB    | yes    |
| `avatars`         | user avatars            | 5 MB     | yes    |
| `documents`       | private docs/contracts  | 20 MB    | no     |

---

## 5) Active collections

| Collection ID                      | Purpose                           |
| ---------------------------------- | --------------------------------- |
| `users`                            | user profile + role               |
| `user_preferences`                 | per-user UI preferences           |
| `favorites`                        | user favorite resources           |
| `resources`                        | main marketplace catalog          |
| `resource_images`                  | resource gallery metadata         |
| `rate_plans`                       | pricing/booking plans             |
| `amenities`                        | amenity catalog                   |
| `leads`                            | authenticated interaction intents |
| `marketing_contact_requests`       | CRM marketing contact requests    |
| `marketing_newsletter_subscribers` | CRM newsletter subscribers        |
| `reservations`                     | booking/reservation records       |
| `reservation_payments`             | payment attempts and statuses     |
| `reservation_vouchers`             | issued voucher docs               |
| `reviews`                          | post-reservation reviews          |
| `analytics_daily`                  | daily aggregates                  |
| `activity_logs`                    | audit trail                       |
| `email_verifications`              | email verification tokens         |
| `conversations`                    | chat threads                      |
| `messages`                         | chat messages                     |
| `instance_settings`                | instance mode/modules/limits      |
| `password_resets`                  | custom reset tokens               |

---

## 6) Collection specs

### Collection: `users`

Purpose: profile and authorization data for internal and client users.

| key                            | type       | required | default       | constraints   | why                    |
| ------------------------------ | ---------- | -------- | ------------- | ------------- | ---------------------- |
| `email`                        | `email`    | yes      | -             | valid email   | login identity         |
| `firstName`                    | `string`   | yes      | -             | max 80        | display name           |
| `lastName`                     | `string`   | yes      | -             | max 80        | display name           |
| `role`                         | `enum`     | yes      | -             | 6 values ↓    | role gating            |
| `scopesJson`                   | `string`   | no       | -             | max 4000 JSON | fine-grained scopes    |
| `enabled`                      | `boolean`  | no       | `true`        | -             | account state          |
| `isHidden`                     | `boolean`  | no       | `false`       | -             | hide internal users    |
| `lastSeenAt`                   | `datetime` | no       | -             | ISO 8601      | activity tracking      |
| `avatarFileId`                 | `string`   | no       | -             | max 64        | avatar storage ref     |
| `phoneCountryCode`             | `string`   | no       | -             | max 5         | phone dial code (+52)  |
| `phone`                        | `string`   | no       | -             | max 15        | local phone number     |
| `whatsappCountryCode`          | `string`   | no       | -             | max 5         | WhatsApp dial code     |
| `whatsappNumber`               | `string`   | no       | -             | max 15        | WhatsApp local number  |
| `birthDate`                    | `string`   | no       | -             | max 10        | date of birth          |
| `stripeAccountId`              | `string`   | no       | -             | max 120       | Stripe connect         |
| `stripeOnboardingStatus`       | `enum`     | no       | `not_started` | 4 values ↓    | payout readiness       |
| `stripeOnboardingUrl`          | `url`      | no       | -             | valid URL     | onboarding link        |
| `stripePayoutsEnabled`         | `boolean`  | no       | `false`       | -             | delegated payouts      |
| `stripePayoutsGrantedByUserId` | `string`   | no       | -             | max 64        | payout granter user FK |

Enum values:

- **role** → `root` · `owner` · `staff_manager` · `staff_editor` · `staff_support` · `client`
- **stripeOnboardingStatus** → `not_started` · `pending` · `complete` · `restricted`

Relationships:

- `users (1) -> (N) resources` via `resources.ownerUserId`
- `users (1) -> (N) leads` via `leads.userId`
- `users (1) -> (N) reservations` via `reservations.guestUserId`
- `users (1) -> (N) reservations` via `reservations.resourceOwnerUserId`

Security notes:

- Self read/update by user identity.
- Role/scopes updates only through protected functions.

Indexes:

| index                  | key(s)      | sort | purpose              |
| ---------------------- | ----------- | ---- | -------------------- |
| `uq_users_email`       | `email`     | ↑    | login identity       |
| `idx_users_role`       | `role`      | ↑    | role-based queries   |
| `idx_users_hidden`     | `isHidden`  | ↑    | hide internal users  |
| `idx_users_enabled`    | `enabled`   | ↑    | account state filter |
| `idx_users_createdate` | `createdAt` | ↓    | recent users         |

---

### Collection: `user_preferences`

Purpose: one UI preference document per user.

| key       | type      | required | default  | constraints         | why         |
| --------- | --------- | -------- | -------- | ------------------- | ----------- |
| `userId`  | `string`  | yes      | -        | max 64              | owner FK    |
| `theme`   | `enum`    | no       | `system` | `light,dark,system` | UI theme    |
| `locale`  | `enum`    | no       | `es`     | `es,en`             | language    |
| `enabled` | `boolean` | no       | `true`   | -                   | soft toggle |

Relationships:

- `users (1) -> (1) user_preferences`.

Security notes:

- user owns own preference doc.

Indexes:

| index                  | key(s)   | sort | purpose         |
| ---------------------- | -------- | ---- | --------------- |
| `uq_userprefs_userid`  | `userId` | ↑    | user lookup     |
| `idx_userprefs_locale` | `locale` | ↑    | language filter |

---

### Collection: `favorites`

Purpose: persistent favorites for authenticated users.

| key                   | type     | required | default | constraints | why                  |
| --------------------- | -------- | -------- | ------- | ----------- | -------------------- |
| `userId`              | `string` | yes      | -       | max 64      | owner FK             |
| `resourceId`          | `string` | yes      | -       | max 64      | resource FK          |
| `resourceSlug`        | `string` | no       | -       | max 150     | denormalized link    |
| `resourceTitle`       | `string` | no       | -       | max 200     | denormalized display |
| `resourceOwnerUserId` | `string` | no       | -       | max 64      | owner reference      |

Relationships:

- `users (1) -> (N) favorites`
- `resources (1) -> (N) favorites`

Security notes:

- Authenticated users only.
- Each user only mutates own favorites.

Indexes:

| index                        | key(s)                 | sort | purpose          |
| ---------------------------- | ---------------------- | ---- | ---------------- |
| `uq_favorites_user_resource` | `userId`, `resourceId` | ↑    | avoid duplicates |
| `idx_favorites_user`         | `userId`               | ↑    | user favorites   |
| `idx_favorites_resource`     | `resourceId`           | ↑    | resource counts  |
| `idx_favorites_createdate`   | `createdAt`            | ↓    | recent favorites |

---

### Collection: `resources`

Purpose: canonical marketplace entity.

| key                   | type       | required | default       | constraints          | why                        |
| --------------------- | ---------- | -------- | ------------- | -------------------- | -------------------------- |
| `ownerUserId`         | `string`   | yes      | -             | max 64               | owner FK                   |
| `slug`                | `string`   | yes      | -             | max 150 slug         | public route key           |
| `title`               | `string`   | yes      | -             | max 200              | listing title              |
| `description`         | `string`   | yes      | -             | max 5000             | public details             |
| `resourceType`        | `enum`     | yes      | -             | 6 values ↓           | vertical model             |
| `category`            | `string`   | yes      | -             | max 80               | business categorization    |
| `commercialMode`      | `enum`     | yes      | -             | 4 values ↓           | commercial behavior        |
| `pricingModel`        | `enum`     | no       | `fixed_total` | 9 values ↓           | price periodicity          |
| `bookingType`         | `enum`     | yes      | -             | 4 values ↓           | reservation UX             |
| `price`               | `float`    | yes      | -             | min 0                | commercial value           |
| `currency`            | `enum`     | no       | `MXN`         | `MXN,USD,EUR`        | money code                 |
| `priceNegotiable`     | `boolean`  | no       | `false`       | -                    | negotiation flag           |
| `bedrooms`            | `integer`  | no       | -             | min 0                | property detail            |
| `bathrooms`           | `float`    | no       | -             | min 0                | property detail (½ baths)  |
| `parkingSpaces`       | `integer`  | no       | -             | min 0                | property detail            |
| `totalArea`           | `float`    | no       | -             | min 0                | area in m²                 |
| `builtArea`           | `float`    | no       | -             | min 0                | built area in m²           |
| `floors`              | `integer`  | no       | -             | min 0                | property detail            |
| `yearBuilt`           | `integer`  | no       | -             | min 1800             | property detail            |
| `streetAddress`       | `string`   | no       | -             | max 200              | precise location           |
| `neighborhood`        | `string`   | no       | -             | max 100              | barrio / colonia           |
| `city`                | `string`   | yes      | -             | max 100              | location filter            |
| `state`               | `string`   | yes      | -             | max 100              | location filter            |
| `postalCode`          | `string`   | no       | -             | max 10               | location detail            |
| `country`             | `string`   | no       | `MX`          | max 2 ISO2           | location filter            |
| `latitude`            | `float`    | no       | -             | -90 – 90             | map pin                    |
| `longitude`           | `float`    | no       | -             | -180 – 180           | map pin                    |
| `furnished`           | `enum`     | no       | `unspecified` | 4 values ↓           | rental condition           |
| `petsAllowed`         | `boolean`  | no       | `false`       | -                    | rental condition           |
| `rentPeriod`          | `string`   | no       | -             | max 30               | rental condition           |
| `minStayNights`       | `integer`  | no       | -             | min 1                | short-term constraint      |
| `maxStayNights`       | `integer`  | no       | -             | min 1                | short-term constraint      |
| `checkInTime`         | `string`   | no       | -             | max 5 HH:mm          | short-term schedule        |
| `checkOutTime`        | `string`   | no       | -             | max 5 HH:mm          | short-term schedule        |
| `maxGuests`           | `integer`  | no       | -             | min 1                | guest capacity             |
| `slotDurationMinutes` | `integer`  | no       | `60`          | 15 – 1440            | time-slot booking length   |
| `slotBufferMinutes`   | `integer`  | no       | `0`           | 0 – 240              | gap between slots          |
| `galleryImageIds`     | `string[]` | no       | `[]`          | max 64 ea · 30 items | ordered gallery references |
| `amenities`           | `string[]` | no       | `[]`          | max 64 ea · 80 items | amenity tags               |
| `assignedStaffIds`    | `string[]` | no       | `[]`          | max 64 ea · 20 items | staff user FKs             |
| `attributes`          | `string`   | no       | -             | max 20000 JSON       | extensible profile data    |
| `videoUrl`            | `url`      | no       | -             | valid URL            | media                      |
| `virtualTourUrl`      | `url`      | no       | -             | valid URL            | media                      |
| `status`              | `enum`     | no       | `draft`       | 4 values ↓           | publish state              |
| `featured`            | `boolean`  | no       | `false`       | -                    | ranking                    |
| `enabled`             | `boolean`  | no       | `true`        | -                    | soft delete                |
| `publishedAt`         | `datetime` | no       | -             | ISO 8601             | recency sort               |
| `views`               | `integer`  | no       | `0`           | min 0                | analytics counter          |
| `contactCount`        | `integer`  | no       | `0`           | min 0                | analytics counter          |
| `reservationCount`    | `integer`  | no       | `0`           | min 0                | analytics counter          |

Enum values:

- **resourceType** → `property` · `service` · `music` · `vehicle` · `experience` · `venue`
- **commercialMode** → `sale` · `rent_long_term` · `rent_short_term` · `rent_hourly`
- **pricingModel** → `fixed_total` · `total` · `per_month` · `per_night` · `per_day` · `per_hour` · `per_person` · `per_event` · `per_m2`
- **bookingType** → `manual_contact` · `date_range` · `time_slot` · `fixed_event`
- **furnished** → `unspecified` · `unfurnished` · `semi_furnished` · `furnished`
- **status** → `draft` · `published` · `inactive` · `archived`

Relationships:

- `resources (1) -> (N) resource_images`
- `resources (1) -> (N) rate_plans`
- `resources (1) -> (N) leads`
- `resources (1) -> (N) reservations`
- `resources (1) -> (N) conversations`
- `resources (1) -> (N) reviews`

Security notes:

- Public read only for `status=published` and `enabled=true`.
- Mutations only through authenticated functions with module gates.

Indexes (deployed):

| index                        | type     | key(s)                | sort | purpose             |
| ---------------------------- | -------- | --------------------- | ---- | ------------------- |
| `uq_resources_slug`          | unique   | `slug`                | ↑    | unique route key    |
| `idx_resources_owneruserid`  | key      | `ownerUserId`         | ↑    | owner dashboard     |
| `idx_resources_status`       | key      | `status`              | ↑    | publish state       |
| `idx_resources_city`         | key      | `city`                | ↑    | location filter     |
| `idx_resources_featured`     | key      | `featured`            | ↑    | featured ranking    |
| `idx_resources_type`         | key      | `resourceType`        | ↑    | vertical filter     |
| `idx_resources_mode`         | key      | `commercialMode`      | ↑    | commercial filter   |
| `idx_resources_bookingtype`  | key      | `bookingType`         | ↑    | booking type filter |
| `idx_resources_createdat`    | key      | `$createdAt`          | ↑    | creation sort       |
| `idx_resources_status_date`  | key      | `status`,`$createdAt` | ↑↑   | status + recency    |
| `idx_resources_amenities`    | key      | `amenities`           | ↑    | amenity filter      |
| `full_resources_title`       | fulltext | `title`               | -    | title search        |
| `full_resources_description` | fulltext | `description`         | -    | description search  |

Pending indexes (not yet deployed — create when needed):

| index                     | type | key(s)        | sort | purpose            |
| ------------------------- | ---- | ------------- | ---- | ------------------ |
| `idx_resources_category`  | key  | `category`    | ↑    | category filter    |
| `idx_resources_price`     | key  | `price`       | ↑    | price sort/filter  |
| `idx_resources_state`     | key  | `state`       | ↑    | location filter    |
| `idx_resources_enabled`   | key  | `enabled`     | ↑    | soft delete filter |
| `idx_resources_published` | key  | `publishedAt` | ↓    | recency sort       |

---

### Collection: `resource_images`

Purpose: gallery entries for resources.

| key          | type      | required | default | constraints       | why               |
| ------------ | --------- | -------- | ------- | ----------------- | ----------------- |
| `resourceId` | `string`  | yes      | -       | max 64            | resource FK       |
| `fileId`     | `string`  | yes      | -       | max 64            | storage file link |
| `alt`        | `string`  | no       | -       | max 200           | accessibility     |
| `position`   | `integer` | no       | -       | min 0, max 999    | ordering          |
| `isMain`     | `boolean` | no       | `false` | -                 | hero image flag   |
| `width`      | `integer` | no       | -       | min 0, max 10000  | image width px    |
| `height`     | `integer` | no       | -       | min 0, max 10000  | image height px   |
| `enabled`    | `boolean` | no       | `true`  | -                 | soft delete       |
| `fileSize`   | `integer` | no       | -       | min 1, max 2 147M | original bytes    |

Relationships:

- `resources (1) -> (N) resource_images`.

Security notes:

- Public read only via published resource.
- Internal mutation by resource managers.

Indexes:

| index                           | type   | key(s)                  | sort | purpose             |
| ------------------------------- | ------ | ----------------------- | ---- | ------------------- |
| `idx_resourceimages_resourceid` | key    | `resourceId`            | ↑    | gallery by resource |
| `idx_resourceimages_sortorder`  | key    | `resourceId`,`position` | ↑↑   | ordered gallery     |
| `idx_resourceimages_main`       | key    | `resourceId`,`isMain`   | ↑↑   | hero image lookup   |
| `uq_resourceimages_fileid`      | unique | `fileId`                | ↑    | unique file ref     |

---

### Collection: `rate_plans`

Purpose: per-resource pricing and availability policy.

> **Status: schema deployed, code not yet implemented.**
> Currently pricing is computed directly from `resources.price` + `resources.pricingModel`.
> `rate_plans` will later replace/extend that to support per-resource pricing
> policies: fees, deposits, cancellation rules, min/max stay by booking type.
> Registered in `env.js` (`APPWRITE_COLLECTION_RATE_PLANS_ID`) but not consumed
> by any service, function, or component yet.

| key                  | type      | required | default    | constraints           | why                   |
| -------------------- | --------- | -------- | ---------- | --------------------- | --------------------- |
| `resourceId`         | `string`  | yes      | -          | max 64                | resource FK           |
| `name`               | `string`  | yes      | -          | max 120               | plan label            |
| `pricingModel`       | `enum`    | yes      | -          | same enum as resource | billing mode          |
| `bookingType`        | `enum`    | yes      | -          | same enum as resource | reservation UX        |
| `basePrice`          | `float`   | yes      | -          | min 0, max 999999999  | base price            |
| `currency`           | `enum`    | no       | `MXN`      | `MXN,USD,EUR`         | currency code         |
| `minQuantity`        | `integer` | no       | `1`        | min 1, max 9999       | unit min              |
| `maxQuantity`        | `integer` | no       | `1`        | min 1, max 9999       | unit max              |
| `minStayNights`      | `integer` | no       | `1`        | min 1, max 365        | short-term constraint |
| `maxStayNights`      | `integer` | no       | `365`      | min 1, max 365        | short-term constraint |
| `cleaningFee`        | `float`   | no       | `0`        | min 0, max 999999999  | additional fee        |
| `serviceFee`         | `float`   | no       | `0`        | min 0, max 999999999  | additional fee        |
| `taxRate`            | `float`   | no       | `0`        | min 0, max 100        | tax percentage        |
| `depositType`        | `enum`    | no       | `none`     | see note ↓            | deposit policy        |
| `depositAmount`      | `float`   | no       | `0`        | min 0, max 999999999  | deposit value         |
| `cancellationPolicy` | `enum`    | no       | `moderate` | see note ↓            | cancellation rules    |
| `rulesJson`          | `string`  | no       | -          | max 20000 JSON        | extensible rules      |
| `enabled`            | `boolean` | no       | `true`     | -                     | active flag           |

Enum values (pending formal catalog — verify in Appwrite console):

- **depositType** → `none` · (others TBD when implemented)
- **cancellationPolicy** → `moderate` · (others TBD when implemented)

Relationships:

- `resources (1) -> (N) rate_plans`.

Security notes:

- Internal read/write only.

Indexes:

| index                        | type   | key(s)              | sort | purpose              |
| ---------------------------- | ------ | ------------------- | ---- | -------------------- |
| `uq_rateplans_resource_name` | unique | `resourceId`,`name` | ↑↑   | unique plan/resource |
| `idx_rateplans_resourceid`   | key    | `resourceId`        | ↑    | plans by resource    |
| `idx_rateplans_pricingmodel` | key    | `pricingModel`      | ↑    | billing mode         |
| `idx_rateplans_bookingtype`  | key    | `bookingType`       | ↑    | booking type filter  |
| `idx_rateplans_enabled`      | key    | `enabled`           | ↑    | active filter        |

---

### Collection: `amenities`

Purpose: controlled amenity catalog shared by resources (i18n by column).

| key        | type      | required | default   | constraints | why           |
| ---------- | --------- | -------- | --------- | ----------- | ------------- |
| `slug`     | `string`  | yes      | -         | max 100     | stable key    |
| `name_es`  | `string`  | yes      | -         | max 100     | Spanish label |
| `name_en`  | `string`  | yes      | -         | max 100     | English label |
| `category` | `enum`    | no       | `general` | 5 values ↓  | grouping      |
| `enabled`  | `boolean` | no       | `true`    | -           | active flag   |

Enum values:

- **category** → `general` · `security` · `outdoor` · `services` · `tech`

Relationships:

- Referenced by `resources.amenities` values (slug-based).
- Icons resolved at runtime from `src/data/amenitiesCatalog.js` (not stored in DB).

Security notes:

- Read by public/internal.
- Mutation restricted to root/internal admin.

Indexes:

| index                    | type   | key(s)     | sort | purpose         |
| ------------------------ | ------ | ---------- | ---- | --------------- |
| `uq_amenities_slug`      | unique | `slug`     | ↑    | unique lookup   |
| `idx_amenities_category` | key    | `category` | ↑    | category filter |
| `idx_amenities_enabled`  | key    | `enabled`  | ↑    | active filter   |

---

### Collection: `leads`

Purpose: authenticated user intent tied to resources.

| key                   | type      | required | default              | constraints   | why                |
| --------------------- | --------- | -------- | -------------------- | ------------- | ------------------ |
| `resourceId`          | `string`  | yes      | -                    | max 64        | resource FK        |
| `resourceOwnerUserId` | `string`  | yes      | -                    | max 64        | owner routing      |
| `userId`              | `string`  | yes      | -                    | max 64        | client FK          |
| `lastMessage`         | `string`  | yes      | -                    | max 2000      | latest message     |
| `status`              | `enum`    | no       | `new`                | 5 values ↓    | pipeline stage     |
| `notes`               | `string`  | no       | -                    | max 4000      | internal notes     |
| `conversationId`      | `string`  | no       | -                    | max 64        | chat link          |
| `source`              | `enum`    | no       | `authenticated_chat` | 7 values ↓    | source analytics   |
| `contactChannel`      | `enum`    | no       | `IN_PLATFORM`        | 5 values ↓    | normalized channel |
| `intent`              | `enum`    | no       | `info_request`       | 7 values ↓    | funnel intent      |
| `isArchived`          | `boolean` | no       | `false`              | -             | inbox archive      |
| `metaJson`            | `string`  | no       | -                    | max 8000 JSON | structured payload |
| `enabled`             | `boolean` | no       | `true`               | -             | soft delete        |

Enum values:

- **source** → `authenticated_chat` · `authenticated_form` · `booking_flow` · `manual_admin` · `IN_PLATFORM` · `WHATSAPP` · `EMAIL`
- **contactChannel** → `resource_chat` · `resource_cta_form` · `IN_PLATFORM` · `WHATSAPP` · `EMAIL`
- **intent** → `booking_request` · `booking_request_manual` · `visit_request` · `info_request` · `GENERAL_INQUIRY` · `SCHEDULE_MEETING` · `AVAILABILITY_INQUIRY`
- **status** → `new` · `contacted` · `qualified` · `closed_won` · `closed_lost`

Relationships:

- `resources (1) -> (N) leads`
- `users (1) -> (N) leads`
- `conversations (0..1) -> (N) leads` (optional link)

Security notes:

- Creation only by authenticated functions in platform mode.
- No anonymous platform lead creation.

Indexes:

| index                      | type | key(s)                             | sort | purpose             |
| -------------------------- | ---- | ---------------------------------- | ---- | ------------------- |
| `idx_leads_resourceid`     | key  | `resourceId`                       | ↑    | resource lead list  |
| `idx_leads_ownerid`        | key  | `resourceOwnerUserId`              | ↑    | owner inbox routing |
| `idx_leads_userid`         | key  | `userId`                           | ↑    | user lead history   |
| `idx_leads_status`         | key  | `status`                           | ↑    | pipeline stage      |
| `idx_leads_createdat`      | key  | `$createdAt`                       | ↑    | creation sort       |
| `idx_leads_ownerdate`      | key  | `resourceOwnerUserId`,`$createdAt` | ↑↑   | owner inbox recency |
| `idx_leads_contactchannel` | key  | `contactChannel`                   | ↑    | channel filter      |
| `idx_leads_intent`         | key  | `intent`                           | ↑    | funnel filter       |
| `idx_leads_source`         | key  | `source`                           | ↑    | source filter       |

---

### Collection: `marketing_contact_requests`

Purpose: public CRM marketing contact submissions.

| key         | type      | required | default | constraints   | why              |
| ----------- | --------- | -------- | ------- | ------------- | ---------------- |
| `firstName` | `string`  | yes      | -       | max 60        | contact identity |
| `lastName`  | `string`  | yes      | -       | max 60        | contact identity |
| `email`     | `email`   | yes      | -       | valid email   | reply channel    |
| `phone`     | `string`  | no       | -       | max 20        | optional channel |
| `message`   | `string`  | yes      | -       | max 4000      | inbound request  |
| `source`    | `string`  | no       | -       | max 80        | campaign source  |
| `utmJson`   | `string`  | no       | -       | max 4000 JSON | attribution      |
| `enabled`   | `boolean` | no       | `true`  | -             | soft state       |

Relationships:

- none (marketing-only collection).

Security notes:

- Created only by marketing public function.
- Must not connect to platform lead/chat flow.

Indexes:

| index                     | key(s)       | sort | purpose           |
| ------------------------- | ------------ | ---- | ----------------- |
| `idx_mkt_contact_email`   | `email`      | ↑    | email lookup      |
| `idx_mkt_contact_source`  | `source`     | ↑    | campaign tracking |
| `idx_mkt_contact_enabled` | `enabled`    | ↑    | active state      |
| `idx_mkt_contact_created` | `$createdAt` | ↓    | recent contacts   |

---

### Collection: `marketing_newsletter_subscribers`

Purpose: public CRM newsletter list.

| key         | type      | required | default | constraints   | why                 |
| ----------- | --------- | -------- | ------- | ------------- | ------------------- |
| `email`     | `email`   | yes      | -       | valid email   | subscriber identity |
| `firstName` | `string`  | no       | -       | max 60        | personalization     |
| `lastName`  | `string`  | no       | -       | max 60        | personalization     |
| `source`    | `string`  | no       | -       | max 80        | attribution         |
| `utmJson`   | `string`  | no       | -       | max 4000 JSON | attribution details |
| `enabled`   | `boolean` | no       | `true`  | -             | subscribe state     |

Relationships:

- none (marketing-only collection).

Security notes:

- Created/updated only by marketing newsletter function.
- Must stay isolated from platform interactions.

Indexes:

| index                        | key(s)      | sort | purpose            |
| ---------------------------- | ----------- | ---- | ------------------ |
| `uq_mkt_news_email`          | `email`     | ↑    | unique email       |
| `idx_mkt_news_source`        | `source`    | ↑    | attribution        |
| idx_mkt_newsletter_createdat | `createdAt` | ↓    | recent subscribers |
| `idx_mkt_news_enabled`       | `enabled`   | ↑    | subscribe state    |

---

### Collection: `reservations`

Purpose: booking records for authenticated users.

| key                   | type       | required | default   | constraints              | why                      |
| --------------------- | ---------- | -------- | --------- | ------------------------ | ------------------------ |
| `resourceId`          | `string`   | yes      | -         | max 64                   | resource FK              |
| `resourceOwnerUserId` | `string`   | yes      | -         | max 64                   | owner routing            |
| `guestUserId`         | `string`   | yes      | -         | max 64                   | client FK                |
| `guestName`           | `string`   | yes      | -         | max 120                  | display name snapshot    |
| `guestEmail`          | `email`    | yes      | -         | valid email              | contact snapshot         |
| `guestPhone`          | `string`   | no       | -         | max 20                   | optional phone snapshot  |
| `commercialMode`      | `enum`     | yes      | -         | 4 values ↓               | resource commercial mode |
| `bookingType`         | `enum`     | yes      | -         | 4 values ↓               | reservation UX mode      |
| `checkInDate`         | `datetime` | no       | -         | ISO 8601                 | stay-based start         |
| `checkOutDate`        | `datetime` | no       | -         | ISO 8601 > checkInDate   | stay-based end           |
| `startDateTime`       | `datetime` | no       | -         | ISO 8601                 | time-based start         |
| `endDateTime`         | `datetime` | no       | -         | ISO 8601 > startDateTime | time-based end           |
| `guestCount`          | `integer`  | no       | `1`       | min 1, max 500           | guest headcount          |
| `units`               | `integer`  | no       | `1`       | min 1, max 9999          | unit quantity            |
| `nights`              | `integer`  | no       | `0`       | min 0, max 365           | computed stay length     |
| `baseAmount`          | `float`    | yes      | -         | min 0, max 999999999     | base price               |
| `feesAmount`          | `float`    | no       | `0`       | min 0, max 999999999     | additional fees          |
| `taxAmount`           | `float`    | no       | `0`       | min 0, max 999999999     | tax amount               |
| `totalAmount`         | `float`    | yes      | -         | min 0, max 999999999     | order total              |
| `currency`            | `enum`     | no       | `MXN`     | `MXN,USD,EUR`            | money code               |
| `status`              | `enum`     | no       | `pending` | 5 values ↓               | lifecycle                |
| `paymentStatus`       | `enum`     | no       | `unpaid`  | 5 values ↓               | payment state            |
| `paymentProvider`     | `enum`     | no       | `manual`  | 3 values ↓               | payment provider         |
| `externalRef`         | `string`   | no       | -         | max 120                  | external reference       |
| `specialRequests`     | `string`   | no       | -         | max 2000                 | guest notes              |
| `enabled`             | `boolean`  | no       | `true`    | -                        | soft delete              |
| `holdExpiresAt`       | `datetime` | no       | -         | ISO 8601                 | temporary hold TTL       |

Enum values:

- **commercialMode** → `sale` · `rent_long_term` · `rent_short_term` · `rent_hourly`
- **bookingType** → `manual_contact` · `date_range` · `time_slot` · `fixed_event`
- **status** → `pending` · `confirmed` · `cancelled` · `completed` · `expired`
- **paymentStatus** → `unpaid` · `pending` · `paid` · `failed` · `refunded`
- **paymentProvider** → `stripe` · `mercadopago` · `manual`

Time window rules:

Reservations use exactly one of two window modes, determined by `bookingType`:

- **Stay-based** (`bookingType=date_range`): `checkInDate` + `checkOutDate` required; `nights` computed server-side; `startDateTime`/`endDateTime` null.
- **Time-based** (`bookingType=time_slot` or `fixed_event`): `startDateTime` + `endDateTime` required; `checkInDate`/`checkOutDate` may mirror start/end for backward compat; `nights=0`.
- **Manual** (`bookingType=manual_contact`): either pair may be used depending on `scheduleType` passed at creation.

Relationships:

- `resources (1) -> (N) reservations`
- `users (1) -> (N) reservations` via `guestUserId`
- `users (1) -> (N) reservations` via `resourceOwnerUserId`
- `reservations (1) -> (N) reservation_payments`
- `reservations (1) -> (1) reservation_vouchers`

Security notes:

- Public reservations created by `create-reservation-public` (authenticated client).
- Manual reservations created by `create-reservation-manual` (owner/staff with `reservations.write`).
- `resourceOwnerUserId` always resolved server-side from the resource document (not client-supplied).
- Owner/staff access controlled by scopes.

Indexes (deployed):

| index                            | type | key(s)                             | sort | purpose               |
| -------------------------------- | ---- | ---------------------------------- | ---- | --------------------- |
| `idx_reservations_resourceid`    | key  | `resourceId`                       | ↑    | resource reservations |
| `idx_reservations_ownerid`       | key  | `resourceOwnerUserId`              | ↑    | owner routing         |
| `idx_reservations_guestuserid`   | key  | `guestUserId`                      | ↑    | guest history         |
| `idx_reservations_checkin`       | key  | `checkInDate`                      | ↑    | stay-based lookup     |
| `idx_reservations_startdatetime` | key  | `startDateTime`                    | ↑    | time-based lookup     |
| `idx_reservations_status`        | key  | `status`                           | ↑    | lifecycle filter      |
| `idx_reservations_holdexpires`   | key  | `holdExpiresAt`                    | ↑    | expire pending holds  |
| `idx_reservations_paymentstatus` | key  | `paymentStatus`                    | ↑    | payment state filter  |
| `idx_reservations_createdat`     | key  | `$createdAt`                       | ↑    | creation sort         |
| `idx_reservations_ownerdate`     | key  | `resourceOwnerUserId`,`$createdAt` | ↑↑   | owner inbox recency   |

---

### Collection: `reservation_payments`

Purpose: payment intents/events for reservations.

| key                   | type       | required | default   | constraints          | why                  |
| --------------------- | ---------- | -------- | --------- | -------------------- | -------------------- |
| `reservationId`       | `string`   | yes      | -         | max 64               | reservation FK       |
| `resourceId`          | `string`   | yes      | -         | max 64               | resource FK          |
| `resourceOwnerUserId` | `string`   | yes      | -         | max 64               | owner routing        |
| `provider`            | `enum`     | yes      | -         | 3 values ↓           | payment provider     |
| `providerPaymentId`   | `string`   | no       | `NULL`    | max 120              | provider correlation |
| `providerEventId`     | `string`   | no       | `NULL`    | max 120              | webhook idempotency  |
| `amount`              | `float`    | yes      | -         | min 0, max 999999999 | paid amount          |
| `currency`            | `enum`     | no       | `MXN`     | `MXN,USD,EUR`        | money code           |
| `status`              | `enum`     | no       | `pending` | 5 values ↓           | payment lifecycle    |
| `rawPayload`          | `string`   | no       | `NULL`    | max 20000            | provider payload     |
| `processedAt`         | `datetime` | no       | `NULL`    | ISO 8601             | webhook process time |
| `enabled`             | `boolean`  | no       | `true`    | -                    | soft state           |

Enum values:

- **provider** → `stripe` · `mercadopago` · `manual`
- **status** → `pending` · `succeeded` · `failed` · `refunded` · `cancelled`

Relationships:

- `reservations (1) -> (N) reservation_payments`.

Security notes:

- Writes by payment functions/webhooks only.
- `resourceOwnerUserId` resolved server-side from the reservation document.

Indexes (deployed):

| index                           | type   | key(s)                | sort | purpose             |
| ------------------------------- | ------ | --------------------- | ---- | ------------------- |
| `idx_respayments_reservationid` | key    | `reservationId`       | ↑    | payment timeline    |
| `idx_respayments_resourceid`    | key    | `resourceId`          | ↑    | resource payments   |
| `idx_respayments_ownerid`       | key    | `resourceOwnerUserId` | ↑    | owner routing       |
| `idx_respayments_provider`      | key    | `provider`            | ↑    | provider filter     |
| `uq_respayments_eventid`        | unique | `providerEventId`     | ↑    | webhook idempotency |
| `idx_respayments_status`        | key    | `status`              | ↑    | lifecycle filter    |
| `idx_respayments_createdat`     | key    | `$createdAt`          | ↑    | creation sort       |

---

### Collection: `reservation_vouchers`

Purpose: issued voucher artifacts after confirmed payment.

| key                   | type       | required | default | constraints | why                         |
| --------------------- | ---------- | -------- | ------- | ----------- | --------------------------- |
| `reservationId`       | `string`   | yes      | -       | max 64      | one voucher per reservation |
| `resourceId`          | `string`   | yes      | -       | max 64      | resource FK                 |
| `resourceOwnerUserId` | `string`   | yes      | -       | max 64      | owner routing               |
| `voucherCode`         | `string`   | yes      | -       | max 40      | lookup key                  |
| `voucherUrl`          | `url`      | no       | `NULL`  | valid URL   | canonical voucher link      |
| `qrPayload`           | `string`   | no       | `NULL`  | max 2000    | QR code JSON payload        |
| `issuedAt`            | `datetime` | yes      | -       | ISO 8601    | issuance time               |
| `sentToEmail`         | `email`    | no       | `NULL`  | valid email | email notification target   |
| `enabled`             | `boolean`  | no       | `true`  | -           | soft state                  |

Relationships:

- `reservations (1) -> (1) reservation_vouchers`.

Security notes:

- Generated by `issue-reservation-voucher` function after valid payment.
- `resourceOwnerUserId` resolved server-side from the reservation document.

Indexes (deployed):

| index                           | type   | key(s)                | sort | purpose             |
| ------------------------------- | ------ | --------------------- | ---- | ------------------- |
| `uq_resvouchers_code`           | unique | `voucherCode`         | ↑    | code lookup         |
| `idx_resvouchers_reservationid` | key    | `reservationId`       | ↑    | reservation linkage |
| `idx_resvouchers_resourceid`    | key    | `resourceId`          | ↑    | resource vouchers   |
| `idx_resvouchers_ownerid`       | key    | `resourceOwnerUserId` | ↑    | owner routing       |

---

### Collection: `reviews`

Purpose: post-reservation reviews with moderation flow.

| key               | type       | required | default   | constraints                  | why                        |
| ----------------- | ---------- | -------- | --------- | ---------------------------- | -------------------------- |
| `resourceId`      | `string`   | yes      | -         | max 64                       | resource FK                |
| `reservationId`   | `string`   | yes      | -         | max 64                       | one review per reservation |
| `authorUserId`    | `string`   | yes      | -         | max 64                       | reviewer FK                |
| `authorName`      | `string`   | yes      | -         | max 120                      | reviewer display name      |
| `authorEmailHash` | `string`   | no       | `NULL`    | max 128                      | gravatar / privacy hash    |
| `rating`          | `integer`  | yes      | -         | min 1 max 5                  | score                      |
| `title`           | `string`   | no       | `NULL`    | max 160                      | short summary              |
| `comment`         | `string`   | yes      | -         | max 3000                     | detailed feedback          |
| `status`          | `enum`     | no       | `pending` | `pending,published,rejected` | moderation state           |
| `publishedAt`     | `datetime` | no       | `NULL`    | ISO 8601                     | publish timestamp          |
| `enabled`         | `boolean`  | no       | `true`    | -                            | soft state                 |

Relationships:

- `resources (1) -> (N) reviews`
- `users (1) -> (N) reviews`
- `reservations (1) -> (0..1) reviews`

Security notes:

- Creation by eligible authenticated clients only.
- `authorName` and `authorEmailHash` set server-side by `create-review-public` function.
- Moderation by authorized internal roles.

Indexes (deployed):

| index                      | key(s)         | sort | purpose             |
| -------------------------- | -------------- | ---- | ------------------- |
| `idx_reviews_resourceid`   | `resourceId`   | ↑    | resource reviews    |
| `idx_reviews_authoruserid` | `authorUserId` | ↑    | reviewer history    |
| `idx_reviews_status`       | `status`       | ↑    | moderation queue    |
| `idx_reviews_rating`       | `rating`       | ↑    | score-based queries |
| `idx_reviews_createdat`    | `$createdAt`   | ↑    | creation sort       |

> **Note:** There is no unique index on `reservationId`; uniqueness is enforced by
> function-level idempotency check in `create-review-public`.
>
> **Migration applied:** `idx_reviews_rating` was recreated to index `rating`
> (previously it indexed `status` by mistake). See
> `docs/migrations/MIGRATION_2026-03-03_fix_misnamed_indexes.md`.

---

### Collection: `analytics_daily`

Purpose: denormalized daily KPIs for dashboards.

| key                   | type       | required | default | constraints              | why                  |
| --------------------- | ---------- | -------- | ------- | ------------------------ | -------------------- |
| `metricDate`          | `datetime` | yes      | -       | day-granularity ISO 8601 | date key             |
| `resourcesPublished`  | `integer`  | no       | `0`     | min 0                    | KPI                  |
| `leadsCreated`        | `integer`  | no       | `0`     | min 0                    | KPI                  |
| `reservationsCreated` | `integer`  | no       | `0`     | min 0                    | KPI                  |
| `paymentsApproved`    | `integer`  | no       | `0`     | min 0                    | KPI                  |
| `grossRevenue`        | `float`    | no       | `0`     | min 0                    | KPI                  |
| `currency`            | `enum`     | no       | `MXN`   | `MXN,USD,EUR`            | KPI money code       |
| `payloadJson`         | `string`   | no       | -       | max 8000 JSON            | extra aggregate data |

Relationships:

- derived from operational collections.

Security notes:

- write by scheduled function only.

Indexes:

| index                     | key(s)       | sort | purpose            |
| ------------------------- | ------------ | ---- | ------------------ |
| `uq_analytics_metricdate` | `metricDate` | ↓    | daily chart series |
| `idx_analytics_createdat` | `$createdAt` | ↓    | recent trends      |

---

### Collection: `activity_logs`

Purpose: immutable audit history for critical actions.

| key             | type       | required | default | constraints             | why                              |
| --------------- | ---------- | -------- | ------- | ----------------------- | -------------------------------- |
| `actorUserId`   | `string`   | yes      | -       | max 64                  | actor identity                   |
| `actorRole`     | `enum`     | yes      | -       | 6 values ↓              | actor role snapshot              |
| `action`        | `string`   | yes      | -       | max 80                  | action code                      |
| `entityType`    | `string`   | yes      | -       | max 80                  | target domain                    |
| `entityId`      | `string`   | no       | `NULL`  | max 64                  | target identifier                |
| `beforeData`    | `string`   | no       | `NULL`  | max 20000 JSON          | previous state                   |
| `afterData`     | `string`   | no       | `NULL`  | max 20000 JSON          | new state                        |
| `changedFields` | `string[]` | no       | `NULL`  | max 120 ea              | field-level diff list            |
| `changeSummary` | `string`   | no       | `NULL`  | max 500                 | human-readable change summary    |
| `requestId`     | `string`   | no       | `NULL`  | max 100                 | trace correlation                |
| `ipHash`        | `string`   | no       | `NULL`  | max 128                 | privacy-safe network fingerprint |
| `userAgent`     | `string`   | no       | `NULL`  | max 500                 | client context                   |
| `severity`      | `enum`     | no       | `info`  | `info,warning,critical` | incident priority                |

Enum values:

- **actorRole** → `root` · `owner` · `admin` · `staff` · `client` · `system`

Field usage notes:

- `changedFields` — written by `staff-user-management` (update/enable/disable) and `moderate-review`. Lists field names that changed (e.g. `["status","publishedAt"]`).
- `changeSummary` — defined in schema but **never written by any function** yet. Read by `deep-search-query` for search ranking (returns null). Reserved for future use.
- `ipHash`, `userAgent` — defined in schema but **never written by any function** yet. Reserved for future privacy-safe network forensics.
- `requestId` — written by 5 functions (`send-proposal`, `respond-proposal`, `create-reservation-manual`, `create-reservation-public`, `create-lead`); omitted by remaining functions.

Relationships:

- references many entities by `entityType` + `entityId`.

Security notes:

- writes only by backend functions.
- full read reserved to root/internal contexts.

Indexes (deployed):

| index                      | key(s)                    | sort | purpose                    |
| -------------------------- | ------------------------- | ---- | -------------------------- |
| `idx_activity_actoruserid` | `actorUserId`             | ↑    | timeline by actor          |
| `idx_activity_entitytype`  | `entityType`              | ↑    | entity forensics           |
| `idx_activity_entityid`    | `entityId`                | ↑    | entity lookup              |
| `idx_activity_action`      | `action`                  | ↑    | action filter              |
| `idx_activity_severity`    | `severity`                | ↑    | incident priority          |
| `idx_activity_createdat`   | `$createdAt`              | ↑    | creation sort              |
| `idx_activity_entitydate`  | `entityType`,`$createdAt` | ↑↑   | entity + recency composite |

---

### Collection: `email_verifications`

Purpose: verification token lifecycle for email validation.

| key           | type       | required | default | constraints    | why                 |
| ------------- | ---------- | -------- | ------- | -------------- | ------------------- |
| `userAuthId`  | `string`   | yes      | -       | max 64         | auth user ref       |
| `email`       | `email`    | yes      | -       | valid email    | verification target |
| `token`       | `string`   | yes      | -       | max 128        | secure token        |
| `expireAt`    | `datetime` | yes      | -       | ISO 8601 > now | TTL                 |
| `used`        | `boolean`  | no       | `false` | -              | consumption state   |
| `invalidated` | `boolean`  | no       | `false` | -              | superseded state    |

Relationships:

- `users (1) -> (N) email_verifications`.

Security notes:

- function-only read/write.

Indexes:

| index                             | key(s)                            | sort  | purpose            |
| --------------------------------- | --------------------------------- | ----- | ------------------ |
| `idx_emailverifications_userauth` | `userAuthId`                      | ↑     | user token lookup  |
| `uq_emailverifications_token`     | `token`                           | ↑     | token verification |
| `idx_emailverifications_expireat` | `expireAt`                        | ↑     | cleanup job TTL    |
| `idx_emailverifications_state`    | `userAuthId`,`used`,`invalidated` | ↑,↑,↑ | state filter       |

---

### Collection: `conversations`

Purpose: resource-bound chat thread between client and owner/staff.

| key             | type       | required | default  | constraints              | why                  |
| --------------- | ---------- | -------- | -------- | ------------------------ | -------------------- |
| `resourceId`    | `string`   | yes      | -        | max 64                   | resource FK          |
| `resourceTitle` | `string`   | yes      | -        | max 200                  | denormalized context |
| `clientUserId`  | `string`   | yes      | -        | max 64                   | client FK            |
| `clientName`    | `string`   | yes      | -        | max 120                  | denormalized display |
| `ownerUserId`   | `string`   | yes      | -        | max 64                   | owner FK             |
| `ownerName`     | `string`   | yes      | -        | max 120                  | denormalized display |
| `lastMessage`   | `string`   | no       | `""`     | max 200                  | inbox preview        |
| `lastMessageAt` | `datetime` | no       | -        | ISO 8601                 | sort order           |
| `clientUnread`  | `integer`  | no       | `0`      | min 0 max 9999           | unread counter       |
| `ownerUnread`   | `integer`  | no       | `0`      | min 0 max 9999           | unread counter       |
| `status`        | `enum`     | no       | `active` | `active,archived,closed` | thread state         |
| `enabled`       | `boolean`  | no       | `true`   | -                        | soft delete          |

Relationships:

- `resources (1) -> (N) conversations`
- `users (1) -> (N) conversations` as client and owner
- `conversations (1) -> (N) messages`

Security notes:

- No anonymous access.
- Access limited to conversation participants and root/internal tooling.

Indexes:

| index                     | key(s)                      | sort | purpose                |
| ------------------------- | --------------------------- | ---- | ---------------------- |
| `idx_conv_client`         | `clientUserId`              | ↑    | client inbox           |
| `idx_conv_owner`          | `ownerUserId`               | ↑    | owner inbox            |
| `idx_conv_resource`       | `resourceId`                | ↑    | resource conversations |
| `idx_conv_lastmsg`        | `lastMessageAt`             | ↓    | inbox sort order       |
| `uq_conv_client_resource` | `clientUserId`,`resourceId` | ↑    | unique thread per pair |

---

### Collection: `messages`

Purpose: individual chat messages, including actionable proposals.

| key               | type      | required | default | constraints                              | why                  |
| ----------------- | --------- | -------- | ------- | ---------------------------------------- | -------------------- |
| `conversationId`  | `string`  | yes      | -       | max 64                                   | parent thread        |
| `senderUserId`    | `string`  | yes      | -       | max 64                                   | sender ref           |
| `senderName`      | `string`  | yes      | -       | max 120                                  | denormalized display |
| `senderRole`      | `enum`    | yes      | -       | `client,owner,staff,root`                | sender context       |
| `body`            | `string`  | yes      | -       | max 4000                                 | visible message      |
| `kind`            | `enum`    | no       | `text`  | `text,system,proposal,proposal_response` | message type         |
| `payloadJson`     | `string`  | no       | `NULL`  | max 8000 JSON                            | structured payload   |
| `relatedLeadId`   | `string`  | no       | `NULL`  | max 64                                   | lead linkage         |
| `readByRecipient` | `boolean` | no       | `false` | -                                        | read state           |
| `enabled`         | `boolean` | no       | `true`  | -                                        | soft delete          |

Field usage notes:

- `relatedLeadId` — written by `send-proposal` and `respond-proposal` to link messages to leads. Not currently read by any frontend or function. Reserved for future lead-message correlation UI.
- `readByRecipient` — set to `false` on create; flipped to `true` by `chatService.markAsRead()`. Powers double-tick read receipts in `ChatMessage`.

Relationships:

- `conversations (1) -> (N) messages`

Security notes:

- No anonymous creation.
- Participants only, enforced by function logic and document permissions.

Indexes (deployed):

| index                  | key(s)                                    | sort | purpose                              |
| ---------------------- | ----------------------------------------- | ---- | ------------------------------------ |
| `idx_msg_conversation` | `conversationId`, `enabled`, `$createdAt` | ↑↑↑  | message timeline (soft-delete aware) |

> **Migration applied:** `readBySender` attribute deleted (always `true`, never read).
> `idx_msg_sender` index deleted (no server-side query uses it).
> See `docs/migrations/MIGRATION_2026-03-03_messages_cleanup.md`.

---

### Collection: `instance_settings`

Purpose: instance-level plan, UI mode, module flags, and limits.

| key                | type       | required | default    | constraints                | why                 |
| ------------------ | ---------- | -------- | ---------- | -------------------------- | ------------------- |
| `key`              | `string`   | yes      | -          | max 40 (`main`)            | singleton selector  |
| `planKey`          | `string`   | yes      | -          | `starter,pro,elite,custom` | commercial plan     |
| `uiMode`           | `enum`     | no       | `platform` | `marketing,platform`       | public surface mode |
| `marketingEnabled` | `boolean`  | no       | `false`    | legacy alias               | backward fallback   |
| `enabledModules`   | `string[]` | no       | -          | max 120 ea · 50 items      | module gating       |
| `limits`           | `string`   | no       | -          | max 20000 JSON             | plan limits         |
| `enabled`          | `boolean`  | no       | `true`     | -                          | global toggle       |

Relationships:

- referenced by all module-gated functions.

Security notes:

- Write access only by root-protected flows.

Indexes:

| index                     | key(s) | sort | purpose            |
| ------------------------- | ------ | ---- | ------------------ |
| `uq_instancesettings_key` | `key`  | ↑    | singleton settings |

---

### Collection: `password_resets`

Purpose: custom password reset flow tokens (SMTP-based).

| key           | type       | required | default | constraints | why                   |
| ------------- | ---------- | -------- | ------- | ----------- | --------------------- |
| `userId`      | `string`   | yes      | -       | max 64      | auth user ref         |
| `email`       | `email`    | yes      | -       | valid email | cooldown + validation |
| `token`       | `string`   | yes      | -       | max 64      | lookup token          |
| `expireAt`    | `datetime` | yes      | -       | ISO 8601    | TTL                   |
| `used`        | `boolean`  | no       | `false` | -           | one-time use state    |
| `invalidated` | `boolean`  | no       | `false` | -           | superseded state      |

Relationships:

- `users (1) -> (N) password_resets`.

Security notes:

- function-only access via API key runtime.
- no direct frontend document access.

Indexes:

| index                | key(s)   | sort | purpose           |
| -------------------- | -------- | ---- | ----------------- |
| `idx_pwreset_userid` | `userId` | ↑    | user token lookup |
| `idx_pwreset_email`  | `email`  | ↑    | cooldown check    |
| `uq_pwreset_token`   | `token`  | ↑    | unique token      |

---

## 7) Enum catalogs (canonical)

### `users.role`

- `root`
- `owner`
- `staff_manager`
- `staff_editor`
- `staff_support`
- `client`

### `resources.resourceType`

- `property`
- `service`
- `music`
- `vehicle`
- `experience`
- `venue`

### `resources.commercialMode`

- `sale`
- `rent_long_term`
- `rent_short_term`
- `rent_hourly`

### `resources.bookingType`

- `manual_contact`
- `date_range`
- `time_slot`
- `fixed_event`

### `reservations.commercialMode`

Same values as `resources.commercialMode` (snapshot at creation):

- `sale`
- `rent_long_term`
- `rent_short_term`
- `rent_hourly`

### `reservations.bookingType`

Same values as `resources.bookingType` (snapshot at creation):

- `manual_contact`
- `date_range`
- `time_slot`
- `fixed_event`

### `reservations.status`

- `pending` ← default
- `confirmed`
- `cancelled`
- `completed`
- `expired`

### `reservations.paymentStatus`

- `unpaid` ← default
- `pending`
- `paid`
- `failed`
- `refunded`

### `reservations.paymentProvider`

- `stripe`
- `mercadopago`
- `manual` ← default

### `leads.source`

- `authenticated_chat` ← default
- `authenticated_form`
- `booking_flow`
- `manual_admin`
- `IN_PLATFORM`
- `WHATSAPP`
- `EMAIL`

### `leads.contactChannel`

- `resource_chat`
- `resource_cta_form`
- `IN_PLATFORM` ← default
- `WHATSAPP`
- `EMAIL`

### `leads.intent`

- `booking_request`
- `booking_request_manual`
- `visit_request`
- `info_request` ← default
- `GENERAL_INQUIRY`
- `SCHEDULE_MEETING`
- `AVAILABILITY_INQUIRY`

### `instance_settings.uiMode`

- `marketing`
- `platform`

---

## 8) Relationship implementation note

Appwrite supports `relationship` type, but this schema currently keeps FK compatibility using string IDs (`resourceId`, `userId`, etc.).
Relationship cardinality is documented above and enforced in function/business logic.

---

## 9) Security baseline

- Public browsing: only published/enabled resource data.
- Platform interaction mutations: authenticated session required.
- Marketing collections: public writes allowed, isolated from platform entities.
- Audit writes: backend only.

---

### Collection: `meeting_requests`

Purpose: tracks meeting/visit proposals created alongside leads (v2 flow).

| key             | type      | required | default    | constraints       | why                 |
| --------------- | --------- | -------- | ---------- | ----------------- | ------------------- |
| `lead_id`       | `string`  | yes      | -          | max 36            | lead FK             |
| `thread_id`     | `string`  | yes      | -          | max 36            | conversation FK     |
| `resource_id`   | `string`  | yes      | -          | max 36            | resource FK         |
| `proposed_by`   | `string`  | yes      | -          | max 36            | user who proposed   |
| `proposed_at`   | `string`  | yes      | -          | ISO 8601 datetime | proposed datetime   |
| `mode`          | `enum`    | yes      | -          | 3 values ↓        | meeting format      |
| `duration_mins` | `integer` | no       | `60`       | 15–480            | duration in minutes |
| `status`        | `enum`    | no       | `PROPOSED` | 5 values ↓        | lifecycle state     |

Enum values:

- **mode** → `ONSITE` · `CALL` · `VIDEO`
- **status** → `PROPOSED` · `ACCEPTED` · `COUNTERED` · `REJECTED` · `CANCELLED`

Relationships:

- `leads (1) -> (N) meeting_requests`
- `conversations (1) -> (N) meeting_requests`
- `resources (1) -> (N) meeting_requests`

Security notes:

- Created only by `create-lead` function in platform mode.
- Status changes by owner/staff via function calls.

Indexes:

| index              | key(s)        | sort | purpose              |
| ------------------ | ------------- | ---- | -------------------- |
| `idx_mtg_lead`     | `lead_id`     | ↑    | meetings by lead     |
| `idx_mtg_thread`   | `thread_id`   | ↑    | meetings by thread   |
| `idx_mtg_resource` | `resource_id` | ↑    | meetings by resource |
| `idx_mtg_status`   | `status`      | ↑    | status filtering     |

---

## 10) See also

- `09_appwrite_platform_limits.md`
- `../guides/11_schema_mapping_matrix.md`
- `../skills/project/04_db_conventions_and_naming.md`

---

Last update: 2026-03-02
Schema mode: resource-first
