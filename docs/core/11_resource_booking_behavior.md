# 11_RESOURCE_BOOKING_BEHAVIOR — CANONICAL REFERENCE

## Referencias

- `00_ai_project_context.md`
- `03_appwrite_db_schema.md`
- `src/utils/resourceModel.js`

---

## 1. Scope

This document is the canonical reference for booking behavior per `resourceType`, `commercialMode`, and `bookingType`.
It documents the rules implemented in `getResourceBehavior()` and the wizard profiles in `src/features/properties/wizardProfiles/`.

---

## 2. resourceType catalog (6 first-class types)

| resourceType   | Valid commercialModes                              | Notes                                            |
| -------------- | -------------------------------------------------- | ------------------------------------------------ |
| `property`     | `sale` · `rent_long_term` · `rent_short_term`      | No `rent_hourly`. isVisitMode for sale/long-term |
| `service`      | `rent_short_term` · `rent_hourly`                  | No sale. Providers/freelancers                   |
| `music`        | `rent_short_term` · `rent_hourly`                  | No sale. Acts and bands                          |
| `vehicle`      | `sale` · `rent_long_term` · `rent_short_term`      | No `rent_hourly`                                 |
| `experience`   | `rent_short_term` · `rent_hourly`                  | Tours, workshops, wellness                       |
| `venue`        | `rent_short_term` · `rent_hourly`                  | Event spaces, studios, coworking                 |

---

## 3. bookingType allowed per commercialMode

| commercialMode   | Allowed bookingTypes                                |
| ---------------- | --------------------------------------------------- |
| `sale`           | `manual_contact`                                    |
| `rent_long_term` | `manual_contact`                                    |
| `rent_short_term`| `date_range` · `manual_contact`                     |
| `rent_hourly`    | `time_slot` · `fixed_event` · `manual_contact`      |

Rule: `manual_contact` is always available as a fallback for any commercialMode.

---

## 4. isVisitMode

`isVisitMode = true` when:
- `resourceType === "property"` **AND**
- `commercialMode === "sale"` OR `commercialMode === "rent_long_term"`

Effect in UX:
- The contact/booking CTA renders as "Agendar visita" instead of generic contact.
- The `BookingWizardModal` opens in visit scheduling mode.

All other resourceTypes and commercialModes: `isVisitMode = false`.

---

## 5. manualContactScheduleType

Stored in `attributes.manualContactScheduleType` (explicit override) or inferred from `commercialMode` + `resourceType` when absent.

### Inference rules (only applies when `bookingType === "manual_contact"`)

| resourceType | commercialMode         | Inferred value |
| ------------ | ---------------------- | -------------- |
| `property`   | `sale`                 | `date_range`   |
| `property`   | `rent_long_term`       | `date_range`   |
| `property`   | `rent_short_term`      | `date_range`   |
| any other    | `sale` / `rent_long_term` / `rent_short_term` | `none` |
| any          | `rent_hourly`          | `none` (unless explicit in attributes) |

Valid explicit values: `date_range` · `time_slot` · `none`

If the admin explicitly sets `attributes.manualContactScheduleType`, that always wins over inference.

---

## 6. slotMode

Only meaningful for `bookingType === "time_slot"` (i.e. `rent_hourly` + non-manual).
Stored in `attributes.slotMode`.

| Value        | Behavior in public detail page              | Admin wizard               |
| ------------ | ------------------------------------------- | -------------------------- |
| `predefined` | Slot grid: show pre-built blocks from availability | Wizard shows slot grid config |
| `hour_range` | Hour-range picker: user picks start time + number of hours | Wizard shows start/end window + min/max units |

Default: `predefined` (if attribute absent, UI treats as `predefined`).

Applies to: `service`, `music`, `venue`, `experience` in `rent_hourly`.
Does **not** apply to `property` (no `rent_hourly`) or `vehicle` (no `rent_hourly`).

---

## 7. attributes sub-keys (resources collection)

The `attributes` field is a JSON string (`max 20000`). The following keys have defined behavior in the frontend runtime:

| key                          | type     | applies to                              | notes                                                        |
| ---------------------------- | -------- | --------------------------------------- | ------------------------------------------------------------ |
| `slotMode`                   | `string` | `rent_hourly` + `time_slot`/`fixed_event` | `predefined` or `hour_range`; defaults to `predefined`       |
| `manualContactScheduleType`  | `string` | `manual_contact`                        | `date_range` · `time_slot` · `none`; inferred if absent      |
| `availabilityStartTime`      | `string` | `time_slot` / `fixed_event`             | Business hours start `"HH:MM"` (24h); e.g. `"09:00"`        |
| `availabilityEndTime`        | `string` | `time_slot` / `fixed_event`             | Business hours end `"HH:MM"` (24h); e.g. `"22:00"`          |
| `bookingMinUnits`            | `number` | `time_slot` + `hour_range`              | Minimum number of hours a booking must cover                 |
| `bookingMaxUnits`            | `number` | `time_slot` + `hour_range`              | Maximum number of hours per booking (capacity guard)         |

All other keys in `attributes` are resource-specific extended profile data and have no runtime behavior in the current version.

---

## 8. pricingModel by resourceType + commercialMode

| resourceType | category example | commercialMode      | Allowed pricingModels                          |
| ------------ | ---------------- | ------------------- | ---------------------------------------------- |
| `property`   | `house`          | `sale`              | `fixed_total` · `per_m2`                       |
| `property`   | `house`          | `rent_long_term`    | `per_month` · `fixed_total` · `per_m2`         |
| `property`   | `house`          | `rent_short_term`   | `per_night` · `per_day` · `fixed_total`        |
| `vehicle`    | `car`            | `sale`              | `fixed_total`                                  |
| `vehicle`    | `car`            | `rent_short_term`   | `per_day`                                      |
| `service`    | `chef`           | `rent_short_term`   | `per_day` · `per_person` · `per_event` · `fixed_total` |
| `service`    | `chef`           | `rent_hourly`       | `per_hour` · `per_person` · `per_event` · `fixed_total` |
| `music`      | `dj`             | `rent_short_term`   | `per_day` · `per_event` · `fixed_total`        |
| `music`      | `dj`             | `rent_hourly`       | `per_hour` · `per_event` · `fixed_total`       |
| `experience` | `tour`           | `rent_short_term`   | `per_person` · `per_day` · `per_event` · `fixed_total` |
| `experience` | `tour`           | `rent_hourly`       | `per_hour` · `per_person` · `per_event` · `fixed_total` |
| `venue`      | `event_hall`     | `rent_short_term`   | `per_day` · `per_event` · `fixed_total`        |
| `venue`      | `event_hall`     | `rent_hourly`       | `per_hour` · `per_event` · `fixed_total`       |

Full table is in `src/utils/resourceModel.js` → `ALLOWED_PRICING_MODELS_BY_RESOURCE_CATEGORY_AND_MODE`.

Last-resort fallback (unknown combination): `["fixed_total"]`.

---

## 9. Known constraint: `house` category slug collision

`category = "house"` exists in **both** `resourceType = "property"` and `resourceType = "music"`.

- Property: `category="house"` = residential house.
- Music: `category="house"` = house music genre.

This is a **known slug collision**. Both are valid and exist in production data.

Resolution plan (migration 002 — deferred):
- Rename music `house` to `house_music` in all music resource documents.
- Update `MUSIC_CATEGORIES` constant in `resourceModel.js`.
- Update i18n labels and wizard category selectors.

Until migration 002 runs:
- The `getResourceBehavior()` runtime resolves correctly because `resourceType` is always explicit — category is only interpreted within its resourceType scope.
- No wrong behavior occurs at runtime; the collision is cosmetic in shared category lookup tables.
- New music resources must use `house` (not yet renamed) until migration 002 completes.

---

## 10. ctaType resolution

| bookingType       | Module enabled  | ctaType   |
| ----------------- | --------------- | --------- |
| `manual_contact`  | any             | `contact` |
| `date_range`      | `module.booking.short_term` ON | `book` |
| `date_range`      | `module.booking.short_term` OFF | `contact` |
| `time_slot`       | `module.booking.hourly` ON | `book` |
| `time_slot`       | `module.booking.hourly` OFF | `contact` |
| `fixed_event`     | `module.booking.hourly` ON | `book` |
| `fixed_event`     | `module.booking.hourly` OFF | `contact` |

---

## 11. QA matrix

### Legend

- ✅ Admin wizard: expected admin editor behavior
- ✅ Public detail: expected public page behavior
- ✅ Reserve flow: expected `/reservar/:slug` behavior

---

### property — sale

| Step | Expected |
|------|----------|
| Admin wizard | commercialMode=sale; bookingType forced to manual_contact; pricingModel options: fixed_total, per_m2; no slotMode field |
| Public detail | isVisitMode=true; CTA "Agendar visita"; no calendar widget shown |
| Reserve flow | BookingWizardModal in visit mode: date picker (manualContactScheduleType=date_range); creates lead with SCHEDULE_MEETING intent |

---

### property — rent_long_term

| Step | Expected |
|------|----------|
| Admin wizard | commercialMode=rent_long_term; bookingType forced to manual_contact; pricingModel options: per_month, fixed_total, per_m2 |
| Public detail | isVisitMode=true; CTA "Agendar visita"; no booking calendar |
| Reserve flow | Same as sale — visit scheduling date picker |

---

### property — rent_short_term — date_range

| Step | Expected |
|------|----------|
| Admin wizard | commercialMode=rent_short_term; bookingType=date_range; pricingModel: per_night, per_day, fixed_total |
| Public detail | isVisitMode=false; calendar availability shown; CTA "Reservar"; requiresPayments=true if payment module ON |
| Reserve flow | Check-in / check-out date picker; creates reservation via create-reservation-public |

---

### property — rent_short_term — manual_contact

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=manual_contact; no slot/calendar config |
| Public detail | CTA "Contactar"; manualContactScheduleType infers to date_range; date range picker shown in contact block |
| Reserve flow | BookingContactBlock with date range picker; creates lead (AVAILABILITY_INQUIRY) |

---

### vehicle — sale

| Step | Expected |
|------|----------|
| Admin wizard | pricingModel forced to fixed_total; bookingType=manual_contact |
| Public detail | isVisitMode=false; CTA "Contactar"; no schedule widget (manualContactScheduleType=none) |
| Reserve flow | Plain contact form; creates lead |

---

### vehicle — rent_short_term — date_range

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=date_range; pricingModel: per_day |
| Public detail | Calendar date picker; CTA "Reservar" |
| Reserve flow | Date range selection; creates reservation |

---

### service — rent_hourly — time_slot — predefined

| Step | Expected |
|------|----------|
| Admin wizard | slotMode=predefined; bookingMinUnits/bookingMaxUnits fields visible; pricingModel: per_hour, per_person, per_event, fixed_total |
| Public detail | Slot grid shown; user selects predefined block |
| Reserve flow | Slot selection → reservation with startDateTime/endDateTime |

---

### service — rent_hourly — time_slot — hour_range

| Step | Expected |
|------|----------|
| Admin wizard | slotMode=hour_range; min/max units visible; start/end availability time fields |
| Public detail | Hour-range picker: start time dropdown + number of hours input |
| Reserve flow | Start time + duration → endDateTime computed; creates reservation |

---

### service — rent_short_term — date_range

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=date_range; pricingModel: per_day, per_person, per_event, fixed_total |
| Public detail | Date range calendar |
| Reserve flow | Check-in/check-out selection |

---

### music — rent_hourly — time_slot (any slotMode)

| Step | Expected |
|------|----------|
| Admin wizard | slotMode selector visible; category from MUSIC_CATEGORIES (including "house"); bookingMinUnits/bookingMaxUnits for hour_range |
| Public detail | Slot or hour-range picker depending on slotMode |
| Reserve flow | Time-based reservation |

---

### music — rent_short_term — manual_contact

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=manual_contact; no slotMode field |
| Public detail | CTA "Contactar"; manualContactScheduleType=none (music non-property); plain contact block |
| Reserve flow | Contact form only; creates lead |

---

### experience — rent_hourly — time_slot

| Step | Expected |
|------|----------|
| Admin wizard | Same as service rent_hourly above |
| Public detail | Slot or hour-range picker |
| Reserve flow | Time-based reservation |

---

### experience — rent_short_term — manual_contact

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=manual_contact; no slotMode |
| Public detail | manualContactScheduleType=none; plain contact |
| Reserve flow | Contact form; creates lead |

---

### venue — rent_hourly — time_slot

| Step | Expected |
|------|----------|
| Admin wizard | slotMode selector; pricingModel: per_hour, per_event, fixed_total |
| Public detail | Slot or hour-range picker |
| Reserve flow | Time-based reservation |

---

### venue — rent_short_term — date_range

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=date_range; pricingModel: per_day, per_event, fixed_total |
| Public detail | Date range calendar |
| Reserve flow | Check-in/check-out selection |

---

### Any resourceType — manual_contact — module.booking.* OFF

| Step | Expected |
|------|----------|
| Admin wizard | bookingType=manual_contact shown as only option |
| Public detail | CTA always "Contactar"; no booking calendar regardless of resourceType |
| Reserve flow | Lead-only flow; no reservation created |

---

## 12. Deferred enhancements (non-blocking)

| Item | Priority | Blocking? | Tracked in |
|------|----------|-----------|------------|
| Migration 002: rename music `house` → `house_music` | Medium | No | `docs/migrations/` |
| Remove legacy alias re-exports from `normalizeResourceDocument()` output (`operationType`, `pricePerUnit`, `propertyId`, `propertyTitle`) | Low | No | After confirmed no consumers |
| `bookingType` backfill: documents with absent `bookingType` need manual correction or targeted per-resourceType script | Low | No | `docs/migrations/001_backfill_canonical_fields.md` |
| E2E smoke test suite covering all 6 resourceType × commercialMode combinations | Medium | No | TBD |
| Expand `manualContactScheduleType=time_slot` path for non-property hourly manual_contact | Low | No | When use case confirmed |

---

Last update: 2026-03-08
Version: 1.0.0
