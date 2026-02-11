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

  async seedDefaultCatalog() {
    ensureAppwriteConfigured();
    ensureCollectionId(
      AMENITIES_COLLECTION_ID,
      "APPWRITE_COLLECTION_AMENITIES_ID"
    );

    const existing = await this.listAll();
    const existingSlugs = new Set(existing.map((item) => item.slug));

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const candidate of DEFAULT_AMENITIES_CATALOG) {
      const normalized = normalizeAmenityInput(candidate);
      if (!normalized.slug || existingSlugs.has(normalized.slug)) {
        skipped += 1;
        continue;
      }

      try {
        await this.create(normalized);
        existingSlugs.add(normalized.slug);
        created += 1;
      } catch (error) {
        errors.push({
          slug: normalized.slug,
          message: error?.message || "No se pudo crear la amenity.",
        });
      }
    }

    return {
      total: DEFAULT_AMENITIES_CATALOG.length,
      created,
      skipped,
      errors,
    };
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
