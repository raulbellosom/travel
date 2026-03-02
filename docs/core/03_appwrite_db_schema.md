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

| key                      | type       | required | default       | constraints                                                  | unique/index        | why                 |
| ------------------------ | ---------- | -------- | ------------- | ------------------------------------------------------------ | ------------------- | ------------------- |
| `email`                  | `email`    | yes      | -             | valid email                                                  | `uq_users_email`    | login identity      |
| `firstName`              | `string`   | yes      | -             | max 80                                                       | -                   | display name        |
| `lastName`               | `string`   | yes      | -             | max 80                                                       | -                   | display name        |
| `role`                   | `enum`     | yes      | -             | `root,owner,staff_manager,staff_editor,staff_support,client` | `idx_users_role`    | role gating         |
| `scopesJson`             | `string`   | no       | -             | max 4000 JSON                                                | -                   | fine-grained scopes |
| `enabled`                | `boolean`  | no       | `true`        | -                                                            | `idx_users_enabled` | account state       |
| `isHidden`               | `boolean`  | no       | `false`       | -                                                            | `idx_users_hidden`  | hide internal users |
| `lastSeenAt`             | `datetime` | no       | -             | ISO 8601                                                     | -                   | activity tracking   |
| `avatarFileId`           | `string`   | no       | -             | max 64                                                       | -                   | avatar storage ref  |
| `phone`                  | `string`   | no       | -             | max 15                                                       | -                   | contact             |
| `stripeAccountId`        | `string`   | no       | -             | max 120                                                      | -                   | Stripe connect      |
| `stripeOnboardingStatus` | `enum`     | no       | `not_started` | `not_started,pending,complete,restricted`                    | -                   | payout readiness    |
| `stripeOnboardingUrl`    | `url`      | no       | -             | valid URL                                                    | -                   | onboarding link     |
| `stripePayoutsEnabled`   | `boolean`  | no       | `false`       | -                                                            | -                   | delegated payouts   |

Relationships:

- `users (1) -> (N) resources` via `resources.ownerUserId`
- `users (1) -> (N) leads` via `leads.userId`
- `users (1) -> (N) reservations` via `reservations.guestUserId`

Security notes:

- Self read/update by user identity.
- Role/scopes updates only through protected functions.

Query/index patterns:

| query                         | indexes            |
| ----------------------------- | ------------------ |
| list users by role            | `idx_users_role`   |
| exclude hidden/internal users | `idx_users_hidden` |
| email lookup                  | `uq_users_email`   |

---

### Collection: `user_preferences`

Purpose: one UI preference document per user.

| key       | type      | required | default  | constraints         | unique/index           | why         |
| --------- | --------- | -------- | -------- | ------------------- | ---------------------- | ----------- |
| `userId`  | `string`  | yes      | -        | max 64              | `uq_userprefs_userid`  | owner FK    |
| `theme`   | `enum`    | no       | `system` | `light,dark,system` | -                      | UI theme    |
| `locale`  | `enum`    | no       | `es`     | `es,en`             | `idx_userprefs_locale` | language    |
| `enabled` | `boolean` | no       | `true`   | -                   | -                      | soft toggle |

Relationships:

- `users (1) -> (1) user_preferences`.

Security notes:

- user owns own preference doc.

Query/index patterns:

| query                   | indexes               |
| ----------------------- | --------------------- |
| get preferences by user | `uq_userprefs_userid` |

---

### Collection: `favorites`

Purpose: persistent favorites for authenticated users.

| key                   | type     | required | default | constraints | unique/index                                           | why                  |
| --------------------- | -------- | -------- | ------- | ----------- | ------------------------------------------------------ | -------------------- |
| `userId`              | `string` | yes      | -       | max 64      | `uq_favorites_user_resource`, `idx_favorites_user`     | owner FK             |
| `resourceId`          | `string` | yes      | -       | max 64      | `uq_favorites_user_resource`, `idx_favorites_resource` | resource FK          |
| `resourceSlug`        | `string` | no       | -       | max 150     | -                                                      | denormalized link    |
| `resourceTitle`       | `string` | no       | -       | max 200     | -                                                      | denormalized display |
| `resourceOwnerUserId` | `string` | no       | -       | max 64      | -                                                      | owner reference      |

Relationships:

- `users (1) -> (N) favorites`
- `resources (1) -> (N) favorites`

Security notes:

- Authenticated users only.
- Each user only mutates own favorites.

Query/index patterns:

| query                       | indexes                      |
| --------------------------- | ---------------------------- |
| list user favorites         | `idx_favorites_user`         |
| count favorites by resource | `idx_favorites_resource`     |
| avoid duplicates            | `uq_favorites_user_resource` |

---

### Collection: `resources`

Purpose: canonical marketplace entity.

| key                | type       | required | default       | constraints                                                                          | unique/index              | why                     |
| ------------------ | ---------- | -------- | ------------- | ------------------------------------------------------------------------------------ | ------------------------- | ----------------------- |
| `ownerUserId`      | `string`   | yes      | -             | max 64                                                                               | `idx_resources_owner`     | owner FK                |
| `slug`             | `string`   | yes      | -             | max 150 slug                                                                         | `uq_resources_slug`       | public route key        |
| `title`            | `string`   | yes      | -             | max 200                                                                              | `idx_resources_title`     | listing title           |
| `description`      | `string`   | yes      | -             | max 5000                                                                             | -                         | public details          |
| `resourceType`     | `enum`     | yes      | -             | `property,service,music,vehicle,experience,venue`                                    | `idx_resources_type`      | vertical model          |
| `category`         | `string`   | yes      | -             | max 80                                                                               | `idx_resources_category`  | business categorization |
| `commercialMode`   | `enum`     | yes      | -             | `sale,rent_long_term,rent_short_term,rent_hourly`                                    | `idx_resources_mode`      | commercial behavior     |
| `pricingModel`     | `enum`     | no       | `fixed_total` | `fixed_total,total,per_month,per_night,per_day,per_hour,per_person,per_event,per_m2` | -                         | price periodicity       |
| `bookingType`      | `enum`     | yes      | -             | `manual_contact,date_range,time_slot,fixed_event`                                    | -                         | reservation UX          |
| `attributes`       | `string`   | no       | -             | max 20000 JSON                                                                       | -                         | extensible profile data |
| `price`            | `float`    | yes      | -             | min 0                                                                                | `idx_resources_price`     | commercial value        |
| `currency`         | `enum`     | no       | `MXN`         | `MXN,USD,EUR`                                                                        | -                         | money code              |
| `city`             | `string`   | yes      | -             | max 100                                                                              | `idx_resources_city`      | location filter         |
| `state`            | `string`   | yes      | -             | max 100                                                                              | `idx_resources_state`     | location filter         |
| `country`          | `string`   | no       | `MX`          | max 2 ISO2                                                                           | -                         | location filter         |
| `videoUrl`         | `url`      | no       | -             | valid URL                                                                            | -                         | media                   |
| `virtualTourUrl`   | `url`      | no       | -             | valid URL                                                                            | -                         | media                   |
| `status`           | `enum`     | no       | `draft`       | `draft,published,inactive,archived`                                                  | `idx_resources_status`    | publish state           |
| `featured`         | `boolean`  | no       | `false`       | -                                                                                    | `idx_resources_featured`  | ranking                 |
| `enabled`          | `boolean`  | no       | `true`        | -                                                                                    | `idx_resources_enabled`   | soft delete             |
| `publishedAt`      | `datetime` | no       | -             | ISO 8601                                                                             | `idx_resources_published` | recency sort            |
| `views`            | `integer`  | no       | `0`           | min 0                                                                                | -                         | analytics counter       |
| `contactCount`     | `integer`  | no       | `0`           | min 0                                                                                | -                         | analytics counter       |
| `reservationCount` | `integer`  | no       | `0`           | min 0                                                                                | -                         | analytics counter       |

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

Query/index patterns:

| query                       | indexes                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| catalog by status/type/city | `idx_resources_status`, `idx_resources_type`, `idx_resources_city` |
| owner dashboard list        | `idx_resources_owner`                                              |
| slug detail lookup          | `uq_resources_slug`                                                |

---

### Collection: `resource_images`

Purpose: gallery entries for resources.

| key          | type      | required | default | constraints | unique/index        | why               |
| ------------ | --------- | -------- | ------- | ----------- | ------------------- | ----------------- |
| `resourceId` | `string`  | yes      | -       | max 64      | `idx_rimg_resource` | resource FK       |
| `fileId`     | `string`  | yes      | -       | max 64      | `uq_rimg_fileid`    | storage file link |
| `alt`        | `string`  | no       | -       | max 180     | -                   | accessibility     |
| `position`   | `integer` | no       | `0`     | min 0       | `idx_rimg_position` | ordering          |
| `enabled`    | `boolean` | no       | `true`  | -           | -                   | soft delete       |

Relationships:

- `resources (1) -> (N) resource_images`.

Security notes:

- Public read only via published resource.
- Internal mutation by resource managers.

Query/index patterns:

| query                              | indexes                                  |
| ---------------------------------- | ---------------------------------------- |
| list gallery by resource and order | `idx_rimg_resource`, `idx_rimg_position` |

---

### Collection: `rate_plans`

Purpose: per-resource pricing and availability policy.

| key            | type      | required | default | constraints            | unique/index             | why           |
| -------------- | --------- | -------- | ------- | ---------------------- | ------------------------ | ------------- |
| `resourceId`   | `string`  | yes      | -       | max 64                 | `idx_rateplans_resource` | resource FK   |
| `name`         | `string`  | yes      | -       | max 120                | -                        | plan label    |
| `pricingModel` | `enum`    | yes      | -       | same enum as resources | `idx_rateplans_model`    | billing mode  |
| `baseAmount`   | `float`   | yes      | -       | min 0                  | -                        | base price    |
| `currency`     | `enum`    | no       | `MXN`   | `MXN,USD,EUR`          | -                        | currency code |
| `minUnits`     | `integer` | no       | `1`     | min 1                  | -                        | stay/hour min |
| `maxUnits`     | `integer` | no       | `365`   | min 1                  | -                        | stay/hour max |
| `enabled`      | `boolean` | no       | `true`  | -                      | -                        | active flag   |

Relationships:

- `resources (1) -> (N) rate_plans`.

Security notes:

- Internal read/write only.

Query/index patterns:

| query                   | indexes                  |
| ----------------------- | ------------------------ |
| list plans for resource | `idx_rateplans_resource` |

---

### Collection: `amenities`

Purpose: controlled amenity catalog shared by resources.

| key       | type      | required | default | constraints | unique/index            | why           |
| --------- | --------- | -------- | ------- | ----------- | ----------------------- | ------------- |
| `slug`    | `string`  | yes      | -       | max 64      | `uq_amenities_slug`     | stable key    |
| `name`    | `string`  | yes      | -       | max 120     | `idx_amenities_name`    | display label |
| `icon`    | `string`  | no       | -       | max 80      | -                       | UI icon ref   |
| `enabled` | `boolean` | no       | `true`  | -           | `idx_amenities_enabled` | active flag   |

Relationships:

- Referenced by `resources.amenities` values.

Security notes:

- Read by public/internal.
- Mutation restricted to root/internal admin.

Query/index patterns:

| query                  | indexes             |
| ---------------------- | ------------------- |
| amenity lookup by slug | `uq_amenities_slug` |

---

### Collection: `leads`

Purpose: authenticated user intent tied to resources.

| key              | type      | required | default | constraints                                                         | unique/index             | why                |
| ---------------- | --------- | -------- | ------- | ------------------------------------------------------------------- | ------------------------ | ------------------ |
| `resourceId`     | `string`  | yes      | -       | max 64                                                              | `idx_leads_resource`     | resource FK        |
| `userId`         | `string`  | yes      | -       | max 64                                                              | `idx_leads_user`         | client FK          |
| `ownerUserId`    | `string`  | yes      | -       | max 64                                                              | `idx_leads_owner`        | owner routing      |
| `conversationId` | `string`  | no       | -       | max 64                                                              | `idx_leads_conversation` | chat link          |
| `source`         | `enum`    | yes      | -       | `authenticated_chat,authenticated_form,booking_flow,manual_admin`   | `idx_leads_source`       | source analytics   |
| `intent`         | `enum`    | yes      | -       | `booking_request,booking_request_manual,visit_request,info_request` | `idx_leads_intent`       | funnel intent      |
| `status`         | `enum`    | no       | `new`   | `new,contacted,qualified,closed_won,closed_lost`                    | `idx_leads_status`       | pipeline stage     |
| `message`        | `string`  | no       | -       | max 4000                                                            | -                        | client note        |
| `metaJson`       | `string`  | no       | -       | max 8000 JSON                                                       | -                        | structured payload |
| `isArchived`     | `boolean` | no       | `false` | -                                                                   | `idx_leads_archived`     | inbox archive      |
| `enabled`        | `boolean` | no       | `true`  | -                                                                   | -                        | soft delete        |

Relationships:

- `resources (1) -> (N) leads`
- `users (1) -> (N) leads`
- `conversations (0..1) -> (N) leads` (optional link)

Security notes:

- Creation only by authenticated functions in platform mode.
- No anonymous platform lead creation.

Query/index patterns:

| query                 | indexes                               |
| --------------------- | ------------------------------------- |
| owner inbox by status | `idx_leads_owner`, `idx_leads_status` |
| user lead history     | `idx_leads_user`                      |
| resource lead list    | `idx_leads_resource`                  |

---

### Collection: `marketing_contact_requests`

Purpose: public CRM marketing contact submissions.

| key         | type      | required | default | constraints   | unique/index             | why              |
| ----------- | --------- | -------- | ------- | ------------- | ------------------------ | ---------------- |
| `firstName` | `string`  | yes      | -       | max 60        | -                        | contact identity |
| `lastName`  | `string`  | yes      | -       | max 60        | -                        | contact identity |
| `email`     | `email`   | yes      | -       | valid email   | `idx_mkt_contact_email`  | reply channel    |
| `phone`     | `string`  | no       | -       | max 20        | -                        | optional channel |
| `message`   | `string`  | yes      | -       | max 4000      | -                        | inbound request  |
| `source`    | `string`  | no       | -       | max 80        | `idx_mkt_contact_source` | campaign source  |
| `utmJson`   | `string`  | no       | -       | max 4000 JSON | -                        | attribution      |
| `enabled`   | `boolean` | no       | `true`  | -             | -                        | soft state       |

Relationships:

- none (marketing-only collection).

Security notes:

- Created only by marketing public function.
- Must not connect to platform lead/chat flow.

Query/index patterns:

| query             | indexes                 |
| ----------------- | ----------------------- |
| contacts by email | `idx_mkt_contact_email` |

---

### Collection: `marketing_newsletter_subscribers`

Purpose: public CRM newsletter list.

| key         | type      | required | default | constraints   | unique/index           | why                 |
| ----------- | --------- | -------- | ------- | ------------- | ---------------------- | ------------------- |
| `email`     | `email`   | yes      | -       | valid email   | `uq_mkt_news_email`    | subscriber identity |
| `firstName` | `string`  | no       | -       | max 60        | -                      | personalization     |
| `lastName`  | `string`  | no       | -       | max 60        | -                      | personalization     |
| `source`    | `string`  | no       | -       | max 80        | `idx_mkt_news_source`  | attribution         |
| `utmJson`   | `string`  | no       | -       | max 4000 JSON | -                      | attribution details |
| `enabled`   | `boolean` | no       | `true`  | -             | `idx_mkt_news_enabled` | subscribe state     |

Relationships:

- none (marketing-only collection).

Security notes:

- Created/updated only by marketing newsletter function.
- Must stay isolated from platform interactions.

Query/index patterns:

| query                                   | indexes             |
| --------------------------------------- | ------------------- |
| subscriber lookup/reactivation by email | `uq_mkt_news_email` |

---

### Collection: `reservations`

Purpose: booking records for authenticated users.

| key               | type       | required | default   | constraints                                     | unique/index              | why              |
| ----------------- | ---------- | -------- | --------- | ----------------------------------------------- | ------------------------- | ---------------- |
| `resourceId`      | `string`   | yes      | -         | max 64                                          | `idx_resv_resource`       | resource FK      |
| `guestUserId`     | `string`   | yes      | -         | max 64                                          | `idx_resv_guest`          | client FK        |
| `guestEmail`      | `email`    | yes      | -         | valid email                                     | `idx_resv_guest_email`    | contact snapshot |
| `ownerUserId`     | `string`   | yes      | -         | max 64                                          | `idx_resv_owner`          | owner routing    |
| `startsAt`        | `datetime` | yes      | -         | ISO 8601                                        | `idx_resv_dates`          | start time       |
| `endsAt`          | `datetime` | yes      | -         | ISO 8601 and > startsAt                         | `idx_resv_dates`          | end time         |
| `status`          | `enum`     | no       | `pending` | `pending,confirmed,cancelled,completed,expired` | `idx_resv_status`         | lifecycle        |
| `paymentStatus`   | `enum`     | no       | `unpaid`  | `unpaid,paid,failed,refunded`                   | `idx_resv_payment_status` | payment state    |
| `totalAmount`     | `float`    | yes      | -         | min 0                                           | -                         | order total      |
| `currency`        | `enum`     | no       | `MXN`     | `MXN,USD,EUR`                                   | -                         | currency         |
| `holdExpiresAt`   | `datetime` | no       | -         | ISO 8601                                        | `idx_resv_hold`           | temporary hold   |
| `clientRequestId` | `string`   | no       | -         | max 80                                          | `idx_resv_client_request` | idempotency      |
| `enabled`         | `boolean`  | no       | `true`    | -                                               | -                         | soft delete      |

Relationships:

- `resources (1) -> (N) reservations`
- `users (1) -> (N) reservations`
- `reservations (1) -> (N) reservation_payments`
- `reservations (1) -> (1) reservation_vouchers`

Security notes:

- Created by authenticated reservation flows.
- Owner/staff access controlled by scopes.

Query/index patterns:

| query                       | indexes                                                  |
| --------------------------- | -------------------------------------------------------- |
| guest reservation history   | `idx_resv_guest`                                         |
| availability overlap checks | `idx_resv_resource`, `idx_resv_dates`, `idx_resv_status` |
| expire pending holds        | `idx_resv_hold`, `idx_resv_status`                       |

---

### Collection: `reservation_payments`

Purpose: payment intents/events for reservations.

| key                 | type      | required | default   | constraints                                   | unique/index              | why                  |
| ------------------- | --------- | -------- | --------- | --------------------------------------------- | ------------------------- | -------------------- |
| `reservationId`     | `string`  | yes      | -         | max 64                                        | `idx_pay_reservation`     | reservation FK       |
| `resourceId`        | `string`  | yes      | -         | max 64                                        | `idx_pay_resource`        | resource FK          |
| `provider`          | `enum`    | yes      | -         | `stripe,mercadopago,manual`                   | `idx_pay_provider`        | payment provider     |
| `providerPaymentId` | `string`  | no       | -         | max 120                                       | `uq_pay_provider_payment` | provider correlation |
| `providerEventId`   | `string`  | no       | -         | max 120                                       | `uq_pay_provider_event`   | webhook idempotency  |
| `status`            | `enum`    | no       | `pending` | `pending,succeeded,failed,refunded,cancelled` | `idx_pay_status`          | payment lifecycle    |
| `amount`            | `float`   | yes      | -         | min 0                                         | -                         | paid amount          |
| `currency`          | `enum`    | no       | `MXN`     | `MXN,USD,EUR`                                 | -                         | money code           |
| `rawJson`           | `string`  | no       | -         | max 20000 JSON                                | -                         | provider payload     |
| `enabled`           | `boolean` | no       | `true`    | -                                             | -                         | soft state           |

Relationships:

- `reservations (1) -> (N) reservation_payments`.

Security notes:

- Writes by payment functions/webhooks only.

Query/index patterns:

| query                        | indexes                 |
| ---------------------------- | ----------------------- |
| reservation payment timeline | `idx_pay_reservation`   |
| webhook idempotency          | `uq_pay_provider_event` |

---

### Collection: `reservation_vouchers`

Purpose: issued voucher artifacts after confirmed payment.

| key             | type       | required | default | constraints | unique/index             | why                         |
| --------------- | ---------- | -------- | ------- | ----------- | ------------------------ | --------------------------- |
| `reservationId` | `string`   | yes      | -       | max 64      | `uq_voucher_reservation` | one voucher per reservation |
| `voucherCode`   | `string`   | yes      | -       | max 40      | `uq_voucher_code`        | lookup key                  |
| `resourceId`    | `string`   | yes      | -       | max 64      | `idx_voucher_resource`   | resource FK                 |
| `guestUserId`   | `string`   | yes      | -       | max 64      | `idx_voucher_guest`      | client FK                   |
| `issuedAt`      | `datetime` | yes      | -       | ISO 8601    | `idx_voucher_issued`     | issuance time               |
| `pdfFileId`     | `string`   | no       | -       | max 64      | -                        | rendered doc                |
| `enabled`       | `boolean`  | no       | `true`  | -           | -                        | soft state                  |

Relationships:

- `reservations (1) -> (1) reservation_vouchers`.

Security notes:

- Generated by voucher function after valid payment.

Query/index patterns:

| query                  | indexes           |
| ---------------------- | ----------------- |
| voucher lookup by code | `uq_voucher_code` |

---

### Collection: `reviews`

Purpose: post-reservation reviews with moderation flow.

| key             | type       | required | default   | constraints                  | unique/index               | why                        |
| --------------- | ---------- | -------- | --------- | ---------------------------- | -------------------------- | -------------------------- |
| `resourceId`    | `string`   | yes      | -         | max 64                       | `idx_reviews_resourceid`   | resource FK                |
| `reservationId` | `string`   | yes      | -         | max 64                       | `uq_reviews_reservation`   | one review per reservation |
| `authorUserId`  | `string`   | yes      | -         | max 64                       | `idx_reviews_authoruserid` | reviewer FK                |
| `rating`        | `integer`  | yes      | -         | min 1 max 5                  | `idx_reviews_rating`       | score                      |
| `title`         | `string`   | no       | -         | max 120                      | -                          | short summary              |
| `comment`       | `string`   | yes      | -         | max 4000                     | -                          | detailed feedback          |
| `status`        | `enum`     | no       | `pending` | `pending,published,rejected` | `idx_reviews_status`       | moderation state           |
| `publishedAt`   | `datetime` | no       | -         | ISO 8601                     | -                          | publish timestamp          |
| `enabled`       | `boolean`  | no       | `true`    | -                            | -                          | soft state                 |

Relationships:

- `resources (1) -> (N) reviews`
- `users (1) -> (N) reviews`
- `reservations (1) -> (0..1) reviews`

Security notes:

- Creation by eligible authenticated clients only.
- Moderation by authorized internal roles.

Query/index patterns:

| query                | indexes                                        |
| -------------------- | ---------------------------------------------- |
| moderation queue     | `idx_reviews_status`, `idx_reviews_createdat`  |
| resource rating list | `idx_reviews_resourceid`, `idx_reviews_rating` |

---

### Collection: `analytics_daily`

Purpose: denormalized daily KPIs for dashboards.

| key                   | type       | required | default | constraints              | unique/index              | why                  |
| --------------------- | ---------- | -------- | ------- | ------------------------ | ------------------------- | -------------------- |
| `metricDate`          | `datetime` | yes      | -       | day-granularity ISO 8601 | `uq_analytics_metricdate` | date key             |
| `resourcesPublished`  | `integer`  | no       | `0`     | min 0                    | -                         | KPI                  |
| `leadsCreated`        | `integer`  | no       | `0`     | min 0                    | -                         | KPI                  |
| `reservationsCreated` | `integer`  | no       | `0`     | min 0                    | -                         | KPI                  |
| `paymentsApproved`    | `integer`  | no       | `0`     | min 0                    | -                         | KPI                  |
| `grossRevenue`        | `float`    | no       | `0`     | min 0                    | -                         | KPI                  |
| `currency`            | `enum`     | no       | `MXN`   | `MXN,USD,EUR`            | -                         | KPI money code       |
| `payloadJson`         | `string`   | no       | -       | max 8000 JSON            | -                         | extra aggregate data |

Relationships:

- derived from operational collections.

Security notes:

- write by scheduled function only.

Query/index patterns:

| query              | indexes                   |
| ------------------ | ------------------------- |
| daily chart series | `uq_analytics_metricdate` |

---

### Collection: `activity_logs`

Purpose: immutable audit history for critical actions.

| key           | type     | required | default | constraints             | unique/index               | why                              |
| ------------- | -------- | -------- | ------- | ----------------------- | -------------------------- | -------------------------------- |
| `actorUserId` | `string` | yes      | -       | max 64                  | `idx_activity_actoruserid` | actor identity                   |
| `actorRole`   | `string` | yes      | -       | max 40                  | -                          | actor role snapshot              |
| `action`      | `string` | yes      | -       | max 80                  | `idx_activity_action`      | action code                      |
| `entityType`  | `string` | yes      | -       | max 80                  | `idx_activity_entitytype`  | target domain                    |
| `entityId`    | `string` | no       | -       | max 64                  | `idx_activity_entityid`    | target identifier                |
| `beforeData`  | `string` | no       | -       | max 20000 JSON          | -                          | previous state                   |
| `afterData`   | `string` | no       | -       | max 20000 JSON          | -                          | new state                        |
| `requestId`   | `string` | no       | -       | max 100                 | -                          | trace correlation                |
| `ipHash`      | `string` | no       | -       | max 128                 | -                          | privacy-safe network fingerprint |
| `userAgent`   | `string` | no       | -       | max 500                 | -                          | client context                   |
| `severity`    | `enum`   | no       | `info`  | `info,warning,critical` | `idx_activity_severity`    | incident priority                |

Relationships:

- references many entities by `entityType` + `entityId`.

Security notes:

- writes only by backend functions.
- full read reserved to root/internal contexts.

Query/index patterns:

| query                   | indexes                                              |
| ----------------------- | ---------------------------------------------------- |
| timeline by actor       | `idx_activity_actoruserid`, `idx_activity_createdat` |
| entity forensic history | `idx_activity_entitytype`, `idx_activity_entityid`   |

---

### Collection: `email_verifications`

Purpose: verification token lifecycle for email validation.

| key           | type       | required | default | constraints    | unique/index                      | why                 |
| ------------- | ---------- | -------- | ------- | -------------- | --------------------------------- | ------------------- |
| `userAuthId`  | `string`   | yes      | -       | max 64         | `idx_emailverifications_userauth` | auth user ref       |
| `email`       | `email`    | yes      | -       | valid email    | -                                 | verification target |
| `token`       | `string`   | yes      | -       | max 128        | `uq_emailverifications_token`     | secure token        |
| `expireAt`    | `datetime` | yes      | -       | ISO 8601 > now | `idx_emailverifications_expireat` | TTL                 |
| `used`        | `boolean`  | no       | `false` | -              | -                                 | consumption state   |
| `invalidated` | `boolean`  | no       | `false` | -              | -                                 | superseded state    |

Relationships:

- `users (1) -> (N) email_verifications`.

Security notes:

- function-only read/write.

Query/index patterns:

| query              | indexes                           |
| ------------------ | --------------------------------- |
| token verification | `uq_emailverifications_token`     |
| cleanup job        | `idx_emailverifications_expireat` |

---

### Collection: `conversations`

Purpose: resource-bound chat thread between client and owner/staff.

| key             | type       | required | default  | constraints              | unique/index                                   | why                  |
| --------------- | ---------- | -------- | -------- | ------------------------ | ---------------------------------------------- | -------------------- |
| `resourceId`    | `string`   | yes      | -        | max 64                   | `idx_conv_resource`, `uq_conv_client_resource` | resource FK          |
| `resourceTitle` | `string`   | yes      | -        | max 200                  | -                                              | denormalized context |
| `clientUserId`  | `string`   | yes      | -        | max 64                   | `idx_conv_client`, `uq_conv_client_resource`   | client FK            |
| `clientName`    | `string`   | yes      | -        | max 120                  | -                                              | denormalized display |
| `ownerUserId`   | `string`   | yes      | -        | max 64                   | `idx_conv_owner`                               | owner FK             |
| `ownerName`     | `string`   | yes      | -        | max 120                  | -                                              | denormalized display |
| `lastMessage`   | `string`   | no       | `""`     | max 200                  | -                                              | inbox preview        |
| `lastMessageAt` | `datetime` | no       | -        | ISO 8601                 | `idx_conv_lastmsg`                             | sort order           |
| `clientUnread`  | `integer`  | no       | `0`      | min 0 max 9999           | -                                              | unread counter       |
| `ownerUnread`   | `integer`  | no       | `0`      | min 0 max 9999           | -                                              | unread counter       |
| `status`        | `enum`     | no       | `active` | `active,archived,closed` | -                                              | thread state         |
| `enabled`       | `boolean`  | no       | `true`   | -                        | -                                              | soft delete          |

Relationships:

- `resources (1) -> (N) conversations`
- `users (1) -> (N) conversations` as client and owner
- `conversations (1) -> (N) messages`

Security notes:

- No anonymous access.
- Access limited to conversation participants and root/internal tooling.

Query/index patterns:

| query                                 | indexes                             |
| ------------------------------------- | ----------------------------------- |
| inbox by client/owner                 | `idx_conv_client`, `idx_conv_owner` |
| reopen/find thread by client+resource | `uq_conv_client_resource`           |

---

### Collection: `messages`

Purpose: individual chat messages, including actionable proposals.

| key               | type      | required | default | constraints                              | unique/index           | why                  |
| ----------------- | --------- | -------- | ------- | ---------------------------------------- | ---------------------- | -------------------- |
| `conversationId`  | `string`  | yes      | -       | max 64                                   | `idx_msg_conversation` | parent thread        |
| `senderUserId`    | `string`  | yes      | -       | max 64                                   | `idx_msg_sender`       | sender ref           |
| `senderName`      | `string`  | yes      | -       | max 120                                  | -                      | denormalized display |
| `senderRole`      | `enum`    | yes      | -       | `client,owner,staff,root`                | -                      | sender context       |
| `body`            | `string`  | yes      | -       | max 4000                                 | -                      | visible message      |
| `kind`            | `enum`    | no       | `text`  | `text,system,proposal,proposal_response` | -                      | message type         |
| `payloadJson`     | `string`  | no       | -       | max 8000 JSON                            | -                      | structured payload   |
| `relatedLeadId`   | `string`  | no       | -       | max 64                                   | -                      | lead linkage         |
| `readBySender`    | `boolean` | no       | `true`  | -                                        | -                      | read state           |
| `readByRecipient` | `boolean` | no       | `false` | -                                        | -                      | read state           |
| `enabled`         | `boolean` | no       | `true`  | -                                        | -                      | soft delete          |

Relationships:

- `conversations (1) -> (N) messages`

Security notes:

- No anonymous creation.
- Participants only, enforced by function logic and document permissions.

Query/index patterns:

| query                    | indexes                |
| ------------------------ | ---------------------- |
| timeline by conversation | `idx_msg_conversation` |
| sender history           | `idx_msg_sender`       |

---

### Collection: `instance_settings`

Purpose: instance-level plan, UI mode, module flags, and limits.

| key                | type       | required | default    | constraints                | unique/index              | why                 |
| ------------------ | ---------- | -------- | ---------- | -------------------------- | ------------------------- | ------------------- |
| `key`              | `string`   | yes      | -          | max 40 (`main`)            | `uq_instancesettings_key` | singleton selector  |
| `planKey`          | `string`   | yes      | -          | `starter,pro,elite,custom` | -                         | commercial plan     |
| `uiMode`           | `enum`     | no       | `platform` | `marketing,platform`       | -                         | public surface mode |
| `marketingEnabled` | `boolean`  | no       | `false`    | legacy alias               | -                         | backward fallback   |
| `enabledModules`   | `string[]` | no       | -          | item max 120               | -                         | module gating       |
| `limits`           | `string`   | no       | -          | max 20000 JSON             | -                         | plan limits         |
| `enabled`          | `boolean`  | no       | `true`     | -                          | -                         | global toggle       |

Relationships:

- referenced by all module-gated functions.

Security notes:

- Write access only by root-protected flows.

Query/index patterns:

| query                   | indexes                   |
| ----------------------- | ------------------------- |
| load singleton settings | `uq_instancesettings_key` |

---

### Collection: `password_resets`

Purpose: custom password reset flow tokens (SMTP-based).

| key           | type       | required | default | constraints | unique/index         | why                   |
| ------------- | ---------- | -------- | ------- | ----------- | -------------------- | --------------------- |
| `userId`      | `string`   | yes      | -       | max 64      | `idx_pwreset_userid` | auth user ref         |
| `email`       | `email`    | yes      | -       | valid email | `idx_pwreset_email`  | cooldown + validation |
| `token`       | `string`   | yes      | -       | max 64      | `uq_pwreset_token`   | lookup token          |
| `expireAt`    | `datetime` | yes      | -       | ISO 8601    | -                    | TTL                   |
| `used`        | `boolean`  | no       | `false` | -           | -                    | one-time use state    |
| `invalidated` | `boolean`  | no       | `false` | -           | -                    | superseded state      |

Relationships:

- `users (1) -> (N) password_resets`.

Security notes:

- function-only access via API key runtime.
- no direct frontend document access.

Query/index patterns:

| query                              | indexes              |
| ---------------------------------- | -------------------- |
| token lookup                       | `uq_pwreset_token`   |
| invalidate previous tokens by user | `idx_pwreset_userid` |

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

### `leads.source`

- `authenticated_chat`
- `authenticated_form`
- `booking_flow`
- `manual_admin`

### `leads.intent`

- `booking_request`
- `booking_request_manual`
- `visit_request`
- `info_request`

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

## 10) See also

- `09_appwrite_platform_limits.md`
- `../guides/11_schema_mapping_matrix.md`
- `../skills/project/04_db_conventions_and_naming.md`

---

Last update: 2026-03-02
Schema mode: resource-first
