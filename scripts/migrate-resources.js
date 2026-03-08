#!/usr/bin/env node
/**
 * Migration: Backfill canonical fields in `resources` collection
 *
 * Targets:
 *   1. category     ← propertyType   (Step 1 — must run before Step 4)
 *   2. commercialMode ← operationType (Step 2)
 *   3. pricingModel ← pricePerUnit   (Step 3)
 *   4. resourceType ← inferred from category (Step 4 — runs after Step 1)
 *   5. Anomaly detection — house collision, missing required fields (Step 5)
 *
 * Usage:
 *   node scripts/migrate-resources.js            # dry-run (default, safe)
 *   DRY_RUN=false node scripts/migrate-resources.js  # live run
 *
 * Required env vars (set in .env or shell):
 *   APPWRITE_ENDPOINT          e.g. https://appwrite.racoondevs.com/v1
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY           server-side API key with databases.read + databases.write
 *   APPWRITE_DATABASE_ID       defaults to "main"
 *   APPWRITE_COLLECTION_RESOURCES_ID  defaults to "resources"
 *
 * Idempotency:
 *   - Never overwrites a field that already has a valid non-empty canonical value.
 *   - Safe to run multiple times.
 *   - Dry-run by default — no writes are made unless DRY_RUN=false.
 *
 * Output:
 *   Writes a JSON report to scripts/migrate-resources-report-<timestamp>.json
 */

import { Client, Databases, Query } from "node-appwrite";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ─── Env ────────────────────────────────────────────────────────────────────

const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const getEnv = (...keys) => {
  for (const key of keys) {
    if (hasValue(process.env[key])) return process.env[key].trim();
  }
  return "";
};

const DRY_RUN = getEnv("DRY_RUN").toLowerCase() !== "false";
const PAGE_SIZE = 100; // Appwrite max practical page size for migrations

const config = {
  endpoint: getEnv("APPWRITE_ENDPOINT"),
  projectId: getEnv("APPWRITE_PROJECT_ID"),
  apiKey: getEnv("APPWRITE_API_KEY"),
  databaseId: getEnv("APPWRITE_DATABASE_ID") || "main",
  resourcesCollectionId:
    getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
};

// ─── Conversion maps (mirrors resourceModel.js — keep in sync) ───────────────

const LEGACY_OPERATION_TO_COMMERCIAL = Object.freeze({
  sale: "sale",
  rent: "rent_long_term",
  vacation_rental: "rent_short_term",
  rent_hourly: "rent_hourly",
});

const LEGACY_PRICE_PER_UNIT_TO_MODEL = Object.freeze({
  total: "fixed_total",
  fixed_total: "fixed_total",
  sqm: "per_m2",
  sqft: "per_m2",
});

const VALID_COMMERCIAL_MODES = new Set([
  "sale",
  "rent_long_term",
  "rent_short_term",
  "rent_hourly",
]);

const VALID_RESOURCE_TYPES = new Set([
  "property",
  "service",
  "music",
  "vehicle",
  "experience",
  "venue",
]);

const VALID_PRICING_MODELS = new Set([
  "fixed_total",
  "total",
  "per_month",
  "per_night",
  "per_day",
  "per_hour",
  "per_person",
  "per_event",
  "per_m2",
]);

/**
 * CATEGORY_RESOURCE_TYPE_MAP
 * Mirrors src/features/properties/wizardProfiles/profileUtils.js
 *
 * NOTE: "house" maps to "property" here.
 * A document with category="house" and no resourceType resolves as property.
 * Music documents with category="house" MUST have an explicit resourceType="music".
 * The collision detector below flags these.
 */
const CATEGORY_RESOURCE_TYPE_MAP = Object.freeze({
  // property
  house: "property",
  apartment: "property",
  land: "property",
  commercial: "property",
  office: "property",
  warehouse: "property",
  // service
  cleaning: "service",
  chef: "service",
  photography: "service",
  catering: "service",
  maintenance: "service",
  // music
  dj: "music",
  banda: "music",
  norteno: "music",
  sierreno: "music",
  mariachi: "music",
  corridos: "music",
  corridos_tumbados: "music",
  corrido_mexicano: "music",
  regional_mexicano: "music",
  duranguense: "music",
  grupera: "music",
  cumbia: "music",
  cumbia_sonidera: "music",
  cumbia_rebajada: "music",
  salsa: "music",
  bachata: "music",
  merengue: "music",
  pop: "music",
  rock: "music",
  rock_urbano: "music",
  hip_hop: "music",
  rap: "music",
  reggaeton: "music",
  urbano_latino: "music",
  electronica: "music",
  techno: "music",
  trance: "music",
  jazz: "music",
  blues: "music",
  boleros: "music",
  trova: "music",
  instrumental: "music",
  versatil: "music",
  son_jarocho: "music",
  huapango: "music",
  sonora: "music",
  // vehicle
  car: "vehicle",
  suv: "vehicle",
  pickup: "vehicle",
  van: "vehicle",
  motorcycle: "vehicle",
  boat: "vehicle",
  // experience
  tour: "experience",
  class: "experience",
  workshop: "experience",
  adventure: "experience",
  wellness: "experience",
  gastronomy: "experience",
  // venue
  event_hall: "venue",
  commercial_local: "venue",
  studio: "venue",
  coworking: "venue",
  meeting_room: "venue",
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normStr = (v) => (hasValue(v) ? String(v).trim().toLowerCase() : "");

/**
 * Determine what patches a document needs.
 * Returns { patches, anomalies } where patches are safe automatic fixes
 * and anomalies are conditions requiring human review.
 *
 * Never patches a field that already has a valid canonical value.
 */
function analyzeDocument(doc) {
  const patches = {};
  const anomalies = [];

  const rawResourceType = normStr(doc.resourceType);
  const rawCategory = normStr(doc.category || doc.propertyType || "");
  const rawCommercialMode = normStr(doc.commercialMode || doc.operationType || "");
  const rawPricingModel = normStr(doc.pricingModel || doc.pricePerUnit || "");
  const rawBookingType = normStr(doc.bookingType || "");

  // ── Step 1: category ← propertyType ───────────────────────────────────────
  const hasCanonicalCategory = hasValue(doc.category);
  const hasLegacyPropertyType = hasValue(doc.propertyType);

  if (!hasCanonicalCategory && hasLegacyPropertyType) {
    const legacyCat = normStr(doc.propertyType);
    patches.category = legacyCat;
  } else if (!hasCanonicalCategory && !hasLegacyPropertyType) {
    anomalies.push({
      field: "category",
      code: "MISSING_NO_FALLBACK",
      message: "No category or propertyType. Cannot infer. Manual intervention required.",
    });
  }

  // Effective category for downstream inference (may be patched)
  const effectiveCategory = patches.category ?? normStr(doc.category ?? "");

  // ── Step 2: commercialMode ← operationType ────────────────────────────────
  const hasCanonicalCommercialMode =
    hasValue(doc.commercialMode) && VALID_COMMERCIAL_MODES.has(normStr(doc.commercialMode));

  if (!hasCanonicalCommercialMode) {
    const legacyOp = normStr(doc.operationType ?? "");
    const inferred = LEGACY_OPERATION_TO_COMMERCIAL[legacyOp];
    if (inferred) {
      patches.commercialMode = inferred;
    } else if (hasValue(doc.commercialMode) && !VALID_COMMERCIAL_MODES.has(normStr(doc.commercialMode))) {
      anomalies.push({
        field: "commercialMode",
        code: "INVALID_VALUE",
        current: doc.commercialMode,
        message: `commercialMode "${doc.commercialMode}" is not a valid enum value.`,
      });
    } else {
      anomalies.push({
        field: "commercialMode",
        code: "MISSING_NO_FALLBACK",
        legacyOperationType: doc.operationType ?? null,
        message: "No commercialMode and no recognizable operationType. Manual intervention required.",
      });
    }
  }

  // ── Step 3: pricingModel ← pricePerUnit ───────────────────────────────────
  const hasCanonicalPricingModel =
    hasValue(doc.pricingModel) && VALID_PRICING_MODELS.has(normStr(doc.pricingModel));

  if (!hasCanonicalPricingModel && hasValue(doc.pricePerUnit)) {
    const legacyUnit = normStr(doc.pricePerUnit);
    const inferred = LEGACY_PRICE_PER_UNIT_TO_MODEL[legacyUnit];
    if (inferred) {
      patches.pricingModel = inferred;
    } else {
      anomalies.push({
        field: "pricingModel",
        code: "UNKNOWN_LEGACY_UNIT",
        legacyPricePerUnit: doc.pricePerUnit,
        message: `pricePerUnit "${doc.pricePerUnit}" has no known pricingModel equivalent.`,
      });
    }
  }
  // If pricingModel is absent but pricePerUnit is also absent, leave it —
  // Appwrite schema has default "fixed_total" so it should resolve correctly.

  // ── Step 4: resourceType ← inferred from category ─────────────────────────
  const hasCanonicalResourceType =
    hasValue(doc.resourceType) && VALID_RESOURCE_TYPES.has(rawResourceType);

  if (!hasCanonicalResourceType) {
    if (effectiveCategory) {
      const inferred = CATEGORY_RESOURCE_TYPE_MAP[effectiveCategory];
      if (inferred) {
        patches.resourceType = inferred;

        // ── Step 5a: house collision check ─────────────────────────────────
        // If the category is "house" but the inferred type is "property",
        // yet the document was potentially a music resource (e.g. had a music
        // title or music amenities), we cannot auto-resolve.
        // We flag ALL documents that get resourceType="property" via category="house"
        // and had no explicit resourceType, so a human can confirm.
        if (effectiveCategory === "house" && inferred === "property") {
          anomalies.push({
            field: "resourceType",
            code: "HOUSE_COLLISION_RISK",
            inferredAs: "property",
            message:
              'category="house" maps to resourceType="property", but "house" is also a valid music genre slug. ' +
              "Verify this document is a property resource and not a house-music act. " +
              "If it is a music resource, set resourceType='music' and category to a distinct slug manually.",
          });
        }
      } else {
        anomalies.push({
          field: "resourceType",
          code: "UNKNOWN_CATEGORY",
          category: effectiveCategory,
          message: `category "${effectiveCategory}" has no mapping in CATEGORY_RESOURCE_TYPE_MAP. Cannot infer resourceType.`,
        });
      }
    } else {
      anomalies.push({
        field: "resourceType",
        code: "MISSING_NO_CATEGORY",
        message: "No category to infer resourceType from. Manual intervention required.",
      });
    }
  }

  // ── Step 5b: bookingType absence ──────────────────────────────────────────
  if (!hasValue(doc.bookingType)) {
    anomalies.push({
      field: "bookingType",
      code: "MISSING_NO_DEFAULT",
      message:
        "bookingType is absent. No safe default exists. Set manually based on the resource behavior.",
    });
  }

  // ── Step 5c: music + house category corruption ────────────────────────────
  if (
    VALID_RESOURCE_TYPES.has(rawResourceType) &&
    rawResourceType === "music" &&
    effectiveCategory === "house"
  ) {
    anomalies.push({
      field: "category",
      code: "MUSIC_HOUSE_SLUG_COLLISION",
      message:
        'resourceType="music" with category="house" is ambiguous. ' +
        '"house" is also a property category slug. ' +
        "Consider changing category to a distinct music-specific slug (e.g. house_music) via a targeted migration.",
    });
  }

  return { patches, anomalies };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

async function* iterateAllDocuments(db, databaseId, collectionId) {
  let cursor = null;
  let pageCount = 0;

  while (true) {
    const queries = [Query.limit(PAGE_SIZE), Query.orderAsc("$id")];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await db.listDocuments(databaseId, collectionId, queries);
    const docs = response.documents;
    pageCount++;

    if (docs.length === 0) break;
    yield* docs;

    if (docs.length < PAGE_SIZE) break;
    cursor = docs[docs.length - 1].$id;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Validate env ──────────────────────────────────────────────────────────
  const missing = ["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY"].filter(
    (k) => !hasValue(process.env[k]),
  );
  if (missing.length > 0) {
    console.error(`\n❌ Missing required env vars: ${missing.join(", ")}`);
    console.error("  Set them in your shell or in a .env file and source it before running.\n");
    process.exit(1);
  }

  // ── Init client ───────────────────────────────────────────────────────────
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const db = new Databases(client);

  console.log("\n========================================");
  console.log(" Resource Migration: Backfill Canonical Fields");
  console.log("========================================");
  console.log(` Mode:       ${DRY_RUN ? "DRY RUN (no writes)" : "⚠️  LIVE RUN (writes enabled)"}`);
  console.log(` Endpoint:   ${config.endpoint}`);
  console.log(` Project:    ${config.projectId}`);
  console.log(` Database:   ${config.databaseId}`);
  console.log(` Collection: ${config.resourcesCollectionId}`);
  console.log("========================================\n");

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: 0,
    clean: 0,
    patched: 0,
    patchedFields: {},
    skippedDryRun: 0,
    errored: 0,
    anomalyCount: 0,
    anomalyCodes: {},
  };

  const report = {
    runAt: new Date().toISOString(),
    mode: DRY_RUN ? "dry_run" : "live",
    endpoint: config.endpoint,
    projectId: config.projectId,
    databaseId: config.databaseId,
    collectionId: config.resourcesCollectionId,
    stats,
    patched: [],
    anomalies: [],
    errors: [],
  };

  // ── Iterate ───────────────────────────────────────────────────────────────
  for await (const doc of iterateAllDocuments(db, config.databaseId, config.resourcesCollectionId)) {
    stats.total++;
    const docId = doc.$id;
    const docLabel = `${doc.slug || doc.title || docId}`;

    const { patches, anomalies } = analyzeDocument(doc);

    // Track anomalies
    if (anomalies.length > 0) {
      stats.anomalyCount += anomalies.length;
      for (const a of anomalies) {
        stats.anomalyCodes[a.code] = (stats.anomalyCodes[a.code] ?? 0) + 1;
      }
      report.anomalies.push({
        docId,
        slug: doc.slug ?? null,
        title: doc.title ?? null,
        currentFields: {
          resourceType: doc.resourceType ?? null,
          category: doc.category ?? null,
          propertyType: doc.propertyType ?? null,
          commercialMode: doc.commercialMode ?? null,
          operationType: doc.operationType ?? null,
          pricingModel: doc.pricingModel ?? null,
          pricePerUnit: doc.pricePerUnit ?? null,
          bookingType: doc.bookingType ?? null,
        },
        anomalies,
      });
    }

    // Apply patches
    if (Object.keys(patches).length === 0) {
      stats.clean++;
      continue;
    }

    // Track what we're patching
    for (const field of Object.keys(patches)) {
      stats.patchedFields[field] = (stats.patchedFields[field] ?? 0) + 1;
    }

    const patchEntry = {
      docId,
      slug: doc.slug ?? null,
      title: doc.title ?? null,
      patches,
      from: {
        resourceType: doc.resourceType ?? null,
        category: doc.category ?? null,
        propertyType: doc.propertyType ?? null,
        commercialMode: doc.commercialMode ?? null,
        operationType: doc.operationType ?? null,
        pricingModel: doc.pricingModel ?? null,
        pricePerUnit: doc.pricePerUnit ?? null,
      },
    };
    report.patched.push(patchEntry);

    if (DRY_RUN) {
      stats.skippedDryRun++;
      console.log(`  [DRY RUN] Would patch "${docLabel}" → ${JSON.stringify(patches)}`);
      continue;
    }

    // Live run — apply patch
    try {
      await db.updateDocument(
        config.databaseId,
        config.resourcesCollectionId,
        docId,
        patches,
      );
      stats.patched++;
      console.log(`  ✅ Patched "${docLabel}" → ${JSON.stringify(patches)}`);
    } catch (err) {
      stats.errored++;
      const errorEntry = {
        docId,
        slug: doc.slug ?? null,
        patches,
        error: err.message,
        code: err.code ?? null,
      };
      report.errors.push(errorEntry);
      console.error(`  ❌ Error patching "${docLabel}": ${err.message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log(" Migration Summary");
  console.log("========================================");
  console.log(` Total documents scanned:   ${stats.total}`);
  console.log(` Already clean (no patches): ${stats.clean}`);
  if (DRY_RUN) {
    console.log(` Would patch (dry run):      ${stats.skippedDryRun}`);
  } else {
    console.log(` Patched successfully:       ${stats.patched}`);
    console.log(` Errors during patch:        ${stats.errored}`);
  }
  console.log(` Anomalies detected:         ${stats.anomalyCount}`);
  if (Object.keys(stats.patchedFields).length > 0) {
    console.log(" Fields patched:");
    for (const [field, count] of Object.entries(stats.patchedFields)) {
      console.log(`   ${field}: ${count} documents`);
    }
  }
  if (Object.keys(stats.anomalyCodes).length > 0) {
    console.log(" Anomaly breakdown:");
    for (const [code, count] of Object.entries(stats.anomalyCodes)) {
      console.log(`   ${code}: ${count}`);
    }
  }
  console.log("========================================\n");

  if (report.anomalies.length > 0) {
    console.log(
      `⚠️  ${report.anomalies.length} documents have anomalies requiring manual review.\n` +
        "   See the full report for details.\n",
    );
  }

  // ── Write report ──────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const __dir = dirname(fileURLToPath(import.meta.url));
  const reportPath = resolve(__dir, `migrate-resources-report-${timestamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`📄 Full report written to:\n   ${reportPath}\n`);

  if (!DRY_RUN && stats.errored > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
