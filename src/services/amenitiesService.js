import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  ID,
  Query,
} from "../api/appwriteClient";
import {
  AMENITY_CATEGORY_VALUES,
  DEFAULT_AMENITIES_CATALOG,
} from "../data/amenitiesCatalog";

const AMENITIES_COLLECTION_ID = env.appwrite.collections.amenities;
const PROPERTY_AMENITIES_COLLECTION_ID = env.appwrite.collections.propertyAmenities;
const PAGE_SIZE = 100;

const ensureCollectionId = (collectionId, envKey) => {
  if (!collectionId) {
    throw new Error(`Configura ${envKey} para usar este modulo.`);
  }
};

const listAllDocuments = async ({ collectionId, queries = [] }) => {
  const documents = [];
  let offset = 0;

  while (true) {
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId,
      queries: [...queries, Query.limit(PAGE_SIZE), Query.offset(offset)],
    });

    const rows = response.documents || [];
    documents.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return documents;
};

const normalizeSlug = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeComparableText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

const sanitizeCategory = (category) =>
  AMENITY_CATEGORY_VALUES.includes(category) ? category : "general";

const normalizeAmenityInput = (input = {}, { includeEnabled = true } = {}) => {
  const data = {
    slug: normalizeSlug(input.slug || ""),
    name_es: String(input.name_es || "").trim(),
    name_en: String(input.name_en || "").trim(),
    category: sanitizeCategory(input.category),
  };

  if (includeEnabled) {
    data.enabled = input.enabled !== false;
  }

  return data;
};

const appendToIndex = (index, key, value) => {
  if (!key) return;
  if (!index.has(key)) {
    index.set(key, []);
  }
  index.get(key).push(value);
};

const findFirstAvailableByKey = (index, key, usedIds) => {
  if (!key || !index.has(key)) return null;
  const candidates = index.get(key) || [];
  return candidates.find((item) => !usedIds.has(item.$id)) || null;
};

const buildDefaultCatalogSeedPlan = (existing = []) => {
  const bySlug = new Map();
  const byNameEs = new Map();
  const byNameEn = new Map();

  for (const item of existing) {
    appendToIndex(bySlug, normalizeSlug(item.slug || ""), item);
    appendToIndex(byNameEs, normalizeComparableText(item.name_es || ""), item);
    appendToIndex(byNameEn, normalizeComparableText(item.name_en || ""), item);
  }

  const usedExistingIds = new Set();
  const toCreate = [];
  const toUpdate = [];
  let unchanged = 0;

  for (const candidate of DEFAULT_AMENITIES_CATALOG) {
    const normalized = normalizeAmenityInput(candidate);
    if (!normalized.slug || !normalized.name_es || !normalized.name_en) {
      continue;
    }

    const nameEsKey = normalizeComparableText(normalized.name_es);
    const nameEnKey = normalizeComparableText(normalized.name_en);

    let target = findFirstAvailableByKey(bySlug, normalized.slug, usedExistingIds);
    if (!target) {
      target = findFirstAvailableByKey(byNameEs, nameEsKey, usedExistingIds);
    }
    if (!target) {
      target = findFirstAvailableByKey(byNameEn, nameEnKey, usedExistingIds);
    }

    if (!target) {
      toCreate.push(normalized);
      continue;
    }

    usedExistingIds.add(target.$id);
    const currentSlug = normalizeSlug(target.slug || "");

    if (currentSlug !== normalized.slug) {
      toUpdate.push({
        amenityId: target.$id,
        currentSlug: target.slug || "",
        nextSlug: normalized.slug,
        name_es: normalized.name_es,
        name_en: normalized.name_en,
        category: normalized.category,
      });
      continue;
    }

    unchanged += 1;
  }

  return {
    total: DEFAULT_AMENITIES_CATALOG.length,
    toCreate,
    toUpdate,
    unchanged,
  };
};

export const amenitiesService = {
  async listActive() {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const documents = await listAllDocuments({
      collectionId: AMENITIES_COLLECTION_ID,
      queries: [Query.equal("enabled", true), Query.orderAsc("name_es")],
    });

    return documents;
  },

  async listAll() {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    return listAllDocuments({
      collectionId: AMENITIES_COLLECTION_ID,
      queries: [Query.orderAsc("name_es")],
    });
  },

  async create(input) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const data = normalizeAmenityInput(input, { includeEnabled: true });

    if (!data.slug || !data.name_es || !data.name_en) {
      throw new Error("Completa slug, nombre ES y nombre EN.");
    }

    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: AMENITIES_COLLECTION_ID,
      documentId: ID.unique(),
      data,
    });
  },

  async update(amenityId, input) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const shouldIncludeEnabled = Object.prototype.hasOwnProperty.call(
      input || {},
      "enabled"
    );

    const data = normalizeAmenityInput(input, {
      includeEnabled: shouldIncludeEnabled,
    });
    if (!data.slug || !data.name_es || !data.name_en) {
      throw new Error("Completa slug, nombre ES y nombre EN.");
    }

    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: AMENITIES_COLLECTION_ID,
      documentId: amenityId,
      data,
    });
  },

  async toggleEnabled(amenityId, enabled) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: AMENITIES_COLLECTION_ID,
      documentId: amenityId,
      data: { enabled: Boolean(enabled) },
    });
  },

  async seedDefaultCatalog(planInput = null) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const plan =
      planInput &&
      Array.isArray(planInput.toCreate) &&
      Array.isArray(planInput.toUpdate)
        ? planInput
        : await this.previewDefaultCatalogSeed();

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const candidate of plan.toCreate) {
      const normalized = normalizeAmenityInput(candidate);
      if (!normalized.slug || !normalized.name_es || !normalized.name_en) {
        continue;
      }

      try {
        await this.create(normalized);
        created += 1;
      } catch (error) {
        errors.push({
          slug: normalized.slug,
          message: error?.message || "No se pudo crear la amenity.",
        });
      }
    }

    for (const candidate of plan.toUpdate) {
      const amenityId = String(candidate.amenityId || "").trim();
      const nextSlug = normalizeSlug(candidate.nextSlug || "");

      if (!amenityId || !nextSlug) continue;

      try {
        await databases.updateDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: AMENITIES_COLLECTION_ID,
          documentId: amenityId,
          data: { slug: nextSlug },
        });
        updated += 1;
      } catch (error) {
        errors.push({
          slug: nextSlug,
          message: error?.message || "No se pudo actualizar la amenity.",
        });
      }
    }

    const unchanged = Math.max(0, Number(plan.unchanged) || 0);

    return {
      total: plan.total,
      created,
      updated,
      unchanged,
      skipped: unchanged,
      errors,
    };
  },

  async previewDefaultCatalogSeed() {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const existing = await this.listAll();
    return buildDefaultCatalogSeedPlan(existing);
  },

  async listPropertyAmenityIds(propertyId) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      PROPERTY_AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID"
    );

    const links = await listAllDocuments({
      collectionId: PROPERTY_AMENITIES_COLLECTION_ID,
      queries: [Query.equal("propertyId", propertyId)],
    });

    return links.map((item) => item.amenityId).filter(Boolean);
  },

  async listForProperty(propertyId) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const amenityIds = await this.listPropertyAmenityIds(propertyId);
    if (amenityIds.length === 0) return [];

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: AMENITIES_COLLECTION_ID,
      queries: [
        Query.equal("$id", amenityIds),
        Query.equal("enabled", true),
        Query.limit(Math.min(PAGE_SIZE, amenityIds.length)),
      ],
    });

    return response.documents || [];
  },

  async syncPropertyAmenities(propertyId, amenityIds = []) {
    ensureAppwriteConfigured();
    ensureCollectionId(
      PROPERTY_AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID"
    );

    const nextIds = Array.from(
      new Set((amenityIds || []).map((id) => String(id || "").trim()).filter(Boolean))
    );

    const currentLinks = await listAllDocuments({
      collectionId: PROPERTY_AMENITIES_COLLECTION_ID,
      queries: [Query.equal("propertyId", propertyId)],
    });

    const currentByAmenityId = new Map(
      currentLinks.map((link) => [link.amenityId, link])
    );

    const toDelete = currentLinks.filter((link) => !nextIds.includes(link.amenityId));
    const toCreate = nextIds.filter((amenityId) => !currentByAmenityId.has(amenityId));

    await Promise.all(
      toDelete.map((link) =>
        databases.deleteDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: PROPERTY_AMENITIES_COLLECTION_ID,
          documentId: link.$id,
        })
      )
    );

    await Promise.all(
      toCreate.map((amenityId) =>
        databases.createDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: PROPERTY_AMENITIES_COLLECTION_ID,
          documentId: ID.unique(),
          data: {
            propertyId,
            amenityId,
          },
        })
      )
    );

    return {
      created: toCreate.length,
      deleted: toDelete.length,
      total: nextIds.length,
    };
  },
};
