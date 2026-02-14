import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  ID,
  Query,
  storage,
} from "../api/appwriteClient";
import { normalizeSlug } from "../utils/slug";

const hasOwn = (input, key) =>
  Object.prototype.hasOwnProperty.call(input || {}, key);

const toNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOperationType = (value = "") => {
  if (value === "vacationRental") return "vacation_rental";
  return value;
};

const normalizePropertyInput = (input = {}, { forUpdate = false } = {}) => {
  const source = input || {};
  const data = {};
  const assign = (key, value) => {
    if (!forUpdate || hasOwn(source, key)) {
      data[key] = value;
    }
  };

  assign("slug", normalizeSlug(source.slug));
  assign("title", String(source.title || "").trim());
  assign("description", String(source.description || "").trim());
  assign("propertyType", String(source.propertyType || "house").trim());
  assign(
    "operationType",
    normalizeOperationType(String(source.operationType || "sale").trim()),
  );
  assign("price", toNumber(source.price, 0));
  assign(
    "currency",
    String(source.currency || "MXN")
      .trim()
      .toUpperCase(),
  );
  assign("pricePerUnit", String(source.pricePerUnit || "total").trim());
  assign("priceNegotiable", Boolean(source.priceNegotiable));
  assign("bedrooms", toNumber(source.bedrooms, 0));
  assign("bathrooms", toNumber(source.bathrooms, 0));
  assign("parkingSpaces", toNumber(source.parkingSpaces, 0));
  assign("totalArea", toNumber(source.totalArea, 0));
  assign("builtArea", toNumber(source.builtArea, 0));
  assign("floors", toNumber(source.floors, 1));
  assign("yearBuilt", toNumber(source.yearBuilt, 0));
  assign("maxGuests", toNumber(source.maxGuests, 1));
  assign("city", String(source.city || "").trim());
  assign("state", String(source.state || "").trim());
  assign(
    "country",
    String(source.country || "MX")
      .trim()
      .toUpperCase(),
  );
  assign("streetAddress", String(source.streetAddress || "").trim());
  assign("neighborhood", String(source.neighborhood || "").trim());
  assign("postalCode", String(source.postalCode || "").trim());
  assign("latitude", String(source.latitude || "").trim());
  assign("longitude", String(source.longitude || "").trim());
  assign("furnished", String(source.furnished || "").trim());
  assign("petsAllowed", Boolean(source.petsAllowed));
  assign("rentPeriod", String(source.rentPeriod || "monthly").trim());
  assign("minStayNights", toNumber(source.minStayNights, 1));
  assign("maxStayNights", toNumber(source.maxStayNights, 365));
  assign("checkInTime", String(source.checkInTime || "").trim());
  assign("checkOutTime", String(source.checkOutTime || "").trim());
  assign("videoUrl", String(source.videoUrl || "").trim());
  assign("virtualTourUrl", String(source.virtualTourUrl || "").trim());
  assign("status", String(source.status || "draft").trim());
  assign("featured", Boolean(source.featured));
  assign("enabled", source.enabled ?? true);

  if (!forUpdate || hasOwn(source, "galleryImageIds")) {
    data.galleryImageIds = Array.isArray(source.galleryImageIds)
      ? source.galleryImageIds.filter(Boolean)
      : [];
  }

  return data;
};

const toPreviewUrl = (fileId) => {
  if (!fileId || !env.appwrite.buckets.propertyImages) return "";

  return storage.getFileView({
    bucketId: env.appwrite.buckets.propertyImages,
    fileId,
  });
};

const normalizeGalleryImageIds = (ids = []) =>
  Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 50);

const areStringArraysEqual = (left = [], right = []) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

export const propertiesService = {
  async checkSlugAvailability(slug, { excludePropertyId = "" } = {}) {
    ensureAppwriteConfigured();
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) {
      return {
        slug: "",
        available: false,
        conflictId: "",
      };
    }

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.properties,
      queries: [Query.equal("slug", normalizedSlug), Query.limit(5)],
    });

    const conflicts = (response.documents || []).filter(
      (document) => document.$id !== excludePropertyId,
    );

    return {
      slug: normalizedSlug,
      available: conflicts.length === 0,
      conflictId: conflicts[0]?.$id || "",
    };
  },

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
    if (filters.minPrice)
      queries.push(Query.greaterThanEqual("price", Number(filters.minPrice)));
    if (filters.maxPrice)
      queries.push(Query.lessThanEqual("price", Number(filters.maxPrice)));
    if (filters.bedrooms)
      queries.push(
        Query.greaterThanEqual("bedrooms", Number(filters.bedrooms)),
      );
    if (filters.featured) queries.push(Query.equal("featured", true));

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
    const normalized = normalizePropertyInput(payload, { forUpdate: false });
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
    const normalized = normalizePropertyInput(payload, { forUpdate: true });

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

  async uploadPropertyImages(
    propertyId,
    files,
    { title = "", startingSortOrder = 0, existingFileIds = [] } = {},
  ) {
    ensureAppwriteConfigured();
    if (!env.appwrite.buckets.propertyImages) {
      throw new Error(
        "No esta configurada APPWRITE_BUCKET_PROPERTY_IMAGES_ID.",
      );
    }
    if (!env.appwrite.collections.propertyImages) {
      throw new Error(
        "No esta configurada APPWRITE_COLLECTION_PROPERTY_IMAGES_ID.",
      );
    }

    const normalizedPropertyId = String(propertyId || "").trim();
    if (!normalizedPropertyId) {
      throw new Error("Property ID invalido para subir imagenes.");
    }

    const filesToUpload = Array.from(files || []).filter(Boolean);
    if (filesToUpload.length === 0) {
      return {
        uploadedImages: [],
        galleryImageIds: normalizeGalleryImageIds(existingFileIds),
      };
    }

    const baseGalleryImageIds = normalizeGalleryImageIds(existingFileIds);
    const baseSortOrder = Math.max(0, Number(startingSortOrder || 0));
    const normalizedAltText = String(title || "").trim();
    const uploadedImages = [];

    for (let index = 0; index < filesToUpload.length; index += 1) {
      const file = filesToUpload[index];
      const uploadedFile = await storage.createFile({
        bucketId: env.appwrite.buckets.propertyImages,
        fileId: ID.unique(),
        file,
      });

      try {
        const imageData = {
          propertyId: normalizedPropertyId,
          fileId: uploadedFile.$id,
          sortOrder: baseSortOrder + index,
          isMain: baseGalleryImageIds.length === 0 && index === 0,
          enabled: true,
        };

        if (normalizedAltText.length >= 3) {
          imageData.altText = normalizedAltText;
        }

        const resolvedFileSize = Number(
          uploadedFile.sizeOriginal || file.size || 0,
        );
        if (Number.isFinite(resolvedFileSize) && resolvedFileSize > 0) {
          imageData.fileSize = resolvedFileSize;
        }

        const imageDoc = await databases.createDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: env.appwrite.collections.propertyImages,
          documentId: ID.unique(),
          data: imageData,
        });

        uploadedImages.push({
          ...imageDoc,
          url: toPreviewUrl(uploadedFile.$id),
        });
      } catch (error) {
        await storage
          .deleteFile({
            bucketId: env.appwrite.buckets.propertyImages,
            fileId: uploadedFile.$id,
          })
          .catch(() => {});
        throw error;
      }
    }

    const nextGalleryImageIds = normalizeGalleryImageIds([
      ...baseGalleryImageIds,
      ...uploadedImages.map((image) => image.fileId),
    ]);

    if (!areStringArraysEqual(baseGalleryImageIds, nextGalleryImageIds)) {
      await databases.updateDocument({
        databaseId: env.appwrite.databaseId,
        collectionId: env.appwrite.collections.properties,
        documentId: normalizedPropertyId,
        data: {
          galleryImageIds: nextGalleryImageIds,
        },
      });
    }

    return {
      uploadedImages,
      galleryImageIds: nextGalleryImageIds,
    };
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
