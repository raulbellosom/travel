# Migration 001 — Backfill canonical fields in `resources`

**Status:** PENDING
**Collection:** `resources` (database: `main`)
**Script:** `scripts/migrate-resources.js`
**Created:** 2026-03-07

---

## Problem

Resource documents created before the canonical schema was locked carry legacy field names
from the old `properties`-first schema. The frontend bridges these via runtime fallbacks in
`resourceModel.js` and `propertiesService.js`. Those fallbacks must be removed to harden
the data model. This migration writes the correct canonical values so the fallbacks become
no-ops and can subsequently be deleted.

---

## Legacy → Canonical field mapping

| Legacy field   | Canonical field  | Conversion                                                         |
| -------------- | ---------------- | ------------------------------------------------------------------ |
| `propertyType` | `category`       | Direct value copy (same slugs)                                     |
| `operationType`| `commercialMode` | `sale→sale`, `rent→rent_long_term`, `vacation_rental→rent_short_term`, `rent_hourly→rent_hourly` |
| `pricePerUnit` | `pricingModel`   | `total→fixed_total`, `sqm/sqft→per_m2`                            |
| *(absent)*     | `resourceType`   | Inferred from `category` via CATEGORY_RESOURCE_TYPE_MAP            |

---

## Migration steps (ordered)

1. **Backfill `category` from `propertyType`** — must run before step 4 (resourceType inference depends on it)
2. **Backfill `commercialMode` from `operationType`** — independent
3. **Backfill `pricingModel` from `pricePerUnit`** — independent
4. **Infer and backfill `resourceType` from `category`** — requires step 1 to be complete
5. **Report anomalies** — read-only, always runs alongside steps 1–4

The script handles all 5 steps in a single pass per document, in the correct dependency order.

---

## Idempotency guarantee

The script never overwrites a field that already holds a valid canonical value.
It only writes a field when the canonical field is absent or invalid AND a safe value
can be determined from the legacy data. Running the script multiple times produces the same result.

---

## Anomaly codes

| Code | Meaning | Action |
|------|---------|--------|
| `MISSING_NO_FALLBACK` | Required field absent, no legacy fallback either | Manual: open document in Appwrite console and set the field |
| `INVALID_VALUE` | Field has a value but it is not a valid enum member | Manual: correct the value |
| `UNKNOWN_LEGACY_UNIT` | `pricePerUnit` has a value not in the conversion map | Manual: determine correct `pricingModel` |
| `UNKNOWN_CATEGORY` | `category` slug not in CATEGORY_RESOURCE_TYPE_MAP | Manual: add slug to map or correct category |
| `HOUSE_COLLISION_RISK` | `category="house"` inferred as property but may be a music act | Manual: verify resource is a property, not a music resource |
| `MUSIC_HOUSE_SLUG_COLLISION` | `resourceType="music"` + `category="house"` coexist | Manual: rename category slug (tracked separately) |
| `MISSING_NO_DEFAULT` | `bookingType` is absent | Manual: no safe default exists |

---

## Runbook

### Pre-flight

1. Ensure you have an Appwrite API key with `databases.read` scope at minimum.
2. Copy `scripts/.env.example` to `scripts/.env` and fill in credentials.
3. Install dependencies: `cd scripts && npm install`

### Step 1: Dry run (always do this first)

```bash
cd scripts
cp .env.example .env
# fill in your credentials in .env
source .env
node migrate-resources.js
```

Review the generated `scripts/migrate-resources-report-<timestamp>.json`.

Specifically check:
- `report.anomalies` — any `HOUSE_COLLISION_RISK` entries require manual inspection before live run
- `report.patched` — confirm the proposed patches look correct
- `report.stats.patchedFields` — sanity-check field counts

### Step 2: Resolve anomalies

For each anomaly:
1. Open the document in the Appwrite console (use `docId` from the report)
2. Inspect the resource title, category, and attributes
3. Set the correct canonical value manually

Only proceed to live run after all anomalies have been resolved or consciously accepted.

### Step 3: Live run

```bash
cd scripts
DRY_RUN=false node migrate-resources.js
```

Review the new report for any errors. If `stats.errored > 0`, investigate each entry in `report.errors`.

### Step 4: Verify

Run the dry run again. All documents should now show `stats.clean = stats.total` (no more patches needed).

### Step 5: Harden `resourceModel.js`

After successful live run and verification, remove the following fallbacks:

- `resourceModel.js:71` — `normalizeResourceType()`: change `return "property"` to throw or return `null`
- `resourceModel.js:585` — `normalizeResourceDocument()`: remove `|| "property"` fallback
- `resourceModel.js:587` — `normalizeResourceDocument()`: remove `|| doc.operationType` fallback
- `resourceModel.js:596` — `normalizeResourceDocument()`: remove `|| doc.propertyType` fallback and `|| "house"` default
- `propertiesService.js` — remove `|| doc.operationType` and `|| doc.propertyType` fallbacks

---

## Known deferred items

- **`house` slug rename**: Documents with `resourceType="music"` and `category="house"` require
  a separate targeted migration to rename the category slug (e.g. `house` → `house_music`).
  This is tracked as migration 002 and must NOT be done in this script.

- **`bookingType` backfill**: No safe default exists. Each document with missing `bookingType`
  must be set manually or through a targeted per-resourceType script once the intent is known.

---

## Post-migration cleanup (after hardening)

Once `resourceModel.js` fallbacks are removed and verified in staging:

1. Remove `LEGACY_OPERATION_TO_COMMERCIAL` and `COMMERCIAL_TO_LEGACY_OPERATION` from `resourceModel.js`
   if no other code still generates legacy output.
2. Remove `toLegacyOperationType()` and `toLegacyPricePerUnit()` and their outputs from
   `normalizeResourceDocument()`.
3. Remove `operationType` and `pricePerUnit` from the normalized document shape — these were
   re-exported for display compatibility and are no longer needed.
