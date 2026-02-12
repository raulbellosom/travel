import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  ID,
  Query,
  storage,
} from "../api/appwriteClient";

const normalizePropertyInput = (input = {}) => {
  return {
    slug: input.slug,
    title: input.title?.trim(),
    description: input.description?.trim(),
    propertyType: input.propertyType,
    operationType: input.operationType,
    price: Number(input.price || 0),
    currency: input.currency || "MXN",
    bedrooms:
      input.bedrooms === "" || input.bedrooms === null
        ? 0
        : Number(input.bedrooms),
    bathrooms:
      input.bathrooms === "" || input.bathrooms === null
        ? 0
        : Number(input.bathrooms),
    maxGuests:
      input.maxGuests === "" || input.maxGuests === null
        ? 1
        : Number(input.maxGuests),
    city: input.city?.trim() || "",
    state: input.state?.trim() || "",
    country: (input.country || "MX").toUpperCase(),
    galleryImageIds: Array.isArray(input.galleryImageIds)
      ? input.galleryImageIds
      : [],
    status: input.status || "draft",
    featured: Boolean(input.featured),
    enabled: input.enabled ?? true,
  };
};

const toPreviewUrl = (fileId) => {
  if (!fileId || !env.appwrite.buckets.propertyImages) return "";

  return storage.getFileView({
    bucketId: env.appwrite.buckets.propertyImages,
    fileId,
  });
};

export const propertiesService = {
  async listPublic({ page = 1, limit = 20, filters = {} } = {}) {
    ensureAppwriteConfigured();

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    const queries = [
      Query.equal("status", "published"),
      Query.equal("enabled", true),
      Query.limit(Number(limit)),
      Query.offset(offset),
    ];

    if (filters.city) queries.push(Query.equal("city", filters.city));
    if (filters.propertyType)
      queries.push(Query.equal("propertyType", filters.propertyType));
    if (filters.operationType)
      queries.push(Query.equal("operationType", filters.operationType));
    if (filters.minPrice) queries.push(Query.greaterThanEqual("price", Number(filters.minPrice)));
    if (filters.maxPrice) queries.push(Query.lessThanEqual("price", Number(filters.maxPrice)));
    if (filters.bedrooms) queries.push(Query.greaterThanEqual("bedrooms", Number(filters.bedrooms)));

    switch (filters.sort) {
      case "price-asc":
        queries.push(Query.orderAsc("price"));
        break;
      case "price-desc":
        queries.push(Query.orderDesc("price"));
        break;
      case "recent":
      default:
        queries.push(Query.orderDesc("$createdAt"));
        break;
    }

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      queries,
    });
  },

  async getPublicBySlug(slug) {
    ensureAppwriteConfigured();
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      queries: [
        Query.equal("slug", slug),
        Query.equal("status", "published"),
        Query.equal("enabled", true),
        Query.limit(1),
      ],
    });

    return response.documents?.[0] || null;
  },

  async getById(propertyId) {
    ensureAppwriteConfigured();
    return databases.getDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      documentId: propertyId,
    });
  },

  async listMine(_userId, { ownerUserId = "", status = "" } = {}) {
    ensureAppwriteConfigured();
    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ];

    // Optional owner filter for explicit per-user analysis screens.
    if (ownerUserId) queries.push(Query.equal("ownerUserId", ownerUserId));
    if (status) queries.push(Query.equal("status", status));

    return databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      queries,
    });
  },

  async create(userId, payload) {
    ensureAppwriteConfigured();
    const normalized = normalizePropertyInput(payload);
    const data = {
      ...normalized,
      ownerUserId: userId,
      views: 0,
      contactCount: 0,
      reservationCount: 0,
    };

    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      documentId: ID.unique(),
      data,
    });
  },

  async update(propertyId, _userId, payload) {
    ensureAppwriteConfigured();
    const normalized = normalizePropertyInput(payload);

    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      documentId: propertyId,
      data: normalized,
    });
  },

  async softDelete(propertyId) {
    ensureAppwriteConfigured();
    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      documentId: propertyId,
      data: {
        enabled: false,
        status: "inactive",
      },
    });
  },

  async listImages(propertyId) {
    ensureAppwriteConfigured();
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.propertyImages,
      queries: [
        Query.equal("propertyId", propertyId),
        Query.equal("enabled", true),
        Query.orderAsc("sortOrder"),
        Query.limit(50),
      ],
    });

    return response.documents.map((doc) => ({
      ...doc,
      url: toPreviewUrl(doc.fileId),
    }));
  },

  async getOwnerProfile(ownerId) {
    ensureAppwriteConfigured();
    return databases.getDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.users,
      documentId: ownerId,
    });
  },
};
