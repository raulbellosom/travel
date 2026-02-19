import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  ID,
  Query,
  storage,
} from "../api/appwriteClient";
import { normalizeSlug } from "../utils/slug";
import {
  normalizeAttributes,
  normalizeBookingType,
  normalizeCommercialMode,
  normalizePricingModel,
  normalizeResourceDocument,
  normalizeResourceType,
  toLegacyOperationType,
  toLegacyPricePerUnit,
} from "../utils/resourceModel";
import {
  isAllowedCategory,
  isAllowedCommercialMode,
  sanitizeCategory,
  sanitizeCommercialMode,
} from "../utils/resourceTaxonomy";

const hasOwn = (input, key) =>
  Object.prototype.hasOwnProperty.call(input || {}, key);

const toNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOperationType = (value = "") => {
  if (value === "vacationRental") return "vacation_rental";
  return String(value || "").trim();
};

const getCollectionConfig = () => {
  const resourcesCollectionId =
    env.appwrite.collections.resources || env.appwrite.collections.properties;
  const legacyPropertiesCollectionId =
    env.appwrite.collections.properties || resourcesCollectionId;
  const resourceImagesCollectionId =
    env.appwrite.collections.resourceImages ||
    env.appwrite.collections.propertyImages;
  const resourceImagesBucketId =
    env.appwrite.buckets.resourceImages || env.appwrite.buckets.propertyImages;

  return {
    resourcesCollectionId,
    legacyPropertiesCollectionId,
    resourceImagesCollectionId,
    resourceImagesBucketId,
    // Resource-only mode: always query canonical fields in resources collection.
    useCanonicalResources: Boolean(resourcesCollectionId),
  };
};

const createValidationError = (message, field, details = {}) => {
  const error = new Error(message);
  error.code = 422;
  error.type = "VALIDATION_ERROR";
  error.field = field;
  error.details = details;
  return error;
};

const normalizeCategoryToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeResourceInput = (
  input = {},
  { forUpdate = false, target = "legacy", existing = {} } = {},
) => {
  const source = input || {};
  const base = existing || {};
  const data = {};
  const assign = (key, value) => {
    if (!forUpdate || hasOwn(source, key)) {
      data[key] = value;
    }
  };

  const hasResourceTypeField = hasOwn(source, "resourceType");
  const hasCategoryField = hasOwn(source, "category") || hasOwn(source, "propertyType");
  const hasCommercialField = hasOwn(source, "commercialMode") || hasOwn(source, "operationType");

  const baseCategoryRaw = normalizeCategoryToken(base.category || base.propertyType);
  const baseCommercialRaw = normalizeCommercialMode(
    base.commercialMode || base.operationType || "sale",
  );

  const normalizedResourceType = normalizeResourceType(
    hasResourceTypeField ? source.resourceType : base.resourceType,
  );
  const categoryInput = hasCategoryField
    ? source.category || source.propertyType
    : baseCategoryRaw;
  const commercialInput = hasCommercialField
    ? source.commercialMode || source.operationType
    : baseCommercialRaw;

  const rawCategory = normalizeCategoryToken(categoryInput);
  const rawCommercialMode = normalizeCommercialMode(commercialInput || "sale");

  if (hasCategoryField && rawCategory && !isAllowedCategory(normalizedResourceType, rawCategory)) {
    throw createValidationError(
      "La categoria seleccionada no es valida para este tipo de recurso.",
      "category",
      {
        resourceType: normalizedResourceType,
        category: rawCategory,
      },
    );
  }

  if (hasCommercialField && !isAllowedCommercialMode(normalizedResourceType, rawCommercialMode)) {
    throw createValidationError(
      "El modo comercial seleccionado no es valido para este tipo de recurso.",
      "commercialMode",
      {
        resourceType: normalizedResourceType,
        commercialMode: rawCommercialMode,
      },
    );
  }

  if (forUpdate && hasResourceTypeField && !hasCategoryField && rawCategory) {
    if (!isAllowedCategory(normalizedResourceType, rawCategory)) {
      throw createValidationError(
        "Debes actualizar la categoria para que sea compatible con el nuevo tipo de recurso.",
        "category",
        {
          resourceType: normalizedResourceType,
          category: rawCategory,
        },
      );
    }
  }

  if (forUpdate && hasResourceTypeField && !hasCommercialField) {
    if (!isAllowedCommercialMode(normalizedResourceType, rawCommercialMode)) {
      throw createValidationError(
        "Debes actualizar el modo comercial para que sea compatible con el nuevo tipo de recurso.",
        "commercialMode",
        {
          resourceType: normalizedResourceType,
          commercialMode: rawCommercialMode,
        },
      );
    }
  }

  const normalizedCategory = sanitizeCategory(
    normalizedResourceType,
    rawCategory || baseCategoryRaw,
  );
  const normalizedCommercialMode = sanitizeCommercialMode(
    normalizedResourceType,
    rawCommercialMode,
  );
  const normalizedPricingModel = normalizePricingModel(
    source.pricingModel || source.pricePerUnit || "total",
    normalizedCommercialMode,
    normalizedResourceType,
  );
  const normalizedBookingType = normalizeBookingType(
    source.bookingType,
    normalizedCommercialMode,
  );
  const normalizedLegacyOperation = toLegacyOperationType(
    normalizedCommercialMode,
  );
  const normalizedLegacyPricePerUnit = toLegacyPricePerUnit(
    normalizedPricingModel,
  );

  assign("slug", normalizeSlug(source.slug));
  assign("title", String(source.title || "").trim());
  assign("description", String(source.description || "").trim());
  assign("price", toNumber(source.price, 0));
  assign(
    "currency",
    String(source.currency || "MXN")
      .trim()
      .toUpperCase(),
  );
  assign("priceNegotiable", Boolean(source.priceNegotiable));

  if (target === "canonical") {
    assign("resourceType", normalizedResourceType);
    assign("category", normalizedCategory);
    assign("commercialMode", normalizedCommercialMode);
    assign("pricingModel", normalizedPricingModel);
    assign("bookingType", normalizedBookingType);
    assign("attributes", normalizeAttributes(source.attributes));
  } else {
    assign("propertyType", normalizedCategory);
    assign("operationType", normalizeOperationType(normalizedLegacyOperation));
    assign("pricePerUnit", normalizedLegacyPricePerUnit);
  }

  assign("bedrooms", toNumber(source.bedrooms, 0));
  assign("bathrooms", toNumber(source.bathrooms, 0));
  assign("parkingSpaces", toNumber(source.parkingSpaces, 0));
  assign("totalArea", toNumber(source.totalArea, null));
  assign("builtArea", toNumber(source.builtArea, null));
  assign("floors", toNumber(source.floors, 1));
  assign("yearBuilt", toNumber(source.yearBuilt, null));
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
  assign("latitude", toNumber(source.latitude, null));
  assign("longitude", toNumber(source.longitude, null));

  const furnished = String(source.furnished || "").trim();
  if (furnished) assign("furnished", furnished);

  assign("petsAllowed", Boolean(source.petsAllowed));

  const rentPeriod = String(source.rentPeriod || "").trim();
  if (rentPeriod) assign("rentPeriod", rentPeriod);

  assign("minStayNights", toNumber(source.minStayNights, 1));
  assign("maxStayNights", toNumber(source.maxStayNights, 365));

  const checkInTime = String(source.checkInTime || "").trim();
  if (checkInTime) assign("checkInTime", checkInTime);

  const checkOutTime = String(source.checkOutTime || "").trim();
  if (checkOutTime) assign("checkOutTime", checkOutTime);

  const videoUrl = String(source.videoUrl || "").trim();
  const virtualTourUrl = String(source.virtualTourUrl || "").trim();
  if (videoUrl) assign("videoUrl", videoUrl);
  if (virtualTourUrl) assign("virtualTourUrl", virtualTourUrl);

  assign("status", String(source.status || "draft").trim());
  assign("featured", Boolean(source.featured));
  assign("enabled", source.enabled ?? true);

  if (!forUpdate || hasOwn(source, "galleryImageIds")) {
    data.galleryImageIds = Array.isArray(source.galleryImageIds)
      ? source.galleryImageIds.filter(Boolean)
      : [];
  }

  if (!forUpdate || hasOwn(source, "amenities")) {
    data.amenities = Array.isArray(source.amenities)
      ? source.amenities
          .map((slug) => String(slug || "").trim())
          .filter(Boolean)
      : [];
  }

  if (!forUpdate || hasOwn(source, "assignedStaffIds")) {
    data.assignedStaffIds = Array.isArray(source.assignedStaffIds)
      ? source.assignedStaffIds
          .map((id) => String(id || "").trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];
  }

  return data;
};

const toPreviewUrl = (fileId) => {
  const { resourceImagesBucketId } = getCollectionConfig();
  if (!fileId || !resourceImagesBucketId) return "";

  return storage.getFileView({
    bucketId: resourceImagesBucketId,
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

const resolveCommercialFilter = (filters = {}) =>
  normalizeCommercialMode(
    filters.commercialMode || filters.operationType || "sale",
  );

const resolveCategoryFilter = (filters = {}) =>
  String(filters.category || filters.propertyType || "").trim().toLowerCase();

const listImagesWithFallbackField = async ({
  databaseId,
  collectionId,
  resourceId,
  idField,
}) =>
  databases.listDocuments({
    databaseId,
    collectionId,
    queries: [
      Query.equal(idField, resourceId),
      Query.equal("enabled", true),
      Query.orderAsc("sortOrder"),
      Query.limit(50),
    ],
  });

const createImageDocWithFallbackField = async ({
  databaseId,
  collectionId,
  resourceId,
  data,
  preferredIdField,
}) => {
  const firstPayload = {
    ...data,
    [preferredIdField]: resourceId,
  };

  try {
    return await databases.createDocument({
      databaseId,
      collectionId,
      documentId: ID.unique(),
      data: firstPayload,
    });
  } catch (firstError) {
    const fallbackField = preferredIdField === "resourceId" ? "propertyId" : "resourceId";
    return databases.createDocument({
      databaseId,
      collectionId,
      documentId: ID.unique(),
      data: {
        ...data,
        [fallbackField]: resourceId,
      },
    });
  }
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

    const { resourcesCollectionId } = getCollectionConfig();
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
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
    const { resourcesCollectionId, useCanonicalResources } = getCollectionConfig();

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    const queries = [
      Query.equal("status", "published"),
      Query.equal("enabled", true),
      Query.limit(Number(limit)),
      Query.offset(offset),
    ];

    if (filters.search) {
      queries.push(Query.search("title", filters.search));
    }

    if (filters.city) queries.push(Query.equal("city", filters.city));
    if (filters.state) queries.push(Query.equal("state", filters.state));

    const categoryFilter = resolveCategoryFilter(filters);
    if (categoryFilter) {
      queries.push(
        Query.equal(useCanonicalResources ? "category" : "propertyType", categoryFilter),
      );
    }

    const hasCommercialFilter =
      String(filters.commercialMode || "").trim() ||
      String(filters.operationType || "").trim();
    if (hasCommercialFilter) {
      const commercial = resolveCommercialFilter(filters);
      queries.push(
        Query.equal(
          useCanonicalResources ? "commercialMode" : "operationType",
          useCanonicalResources ? commercial : toLegacyOperationType(commercial),
        ),
      );
    }

    if (filters.minPrice)
      queries.push(Query.greaterThanEqual("price", Number(filters.minPrice)));
    if (filters.maxPrice)
      queries.push(Query.lessThanEqual("price", Number(filters.maxPrice)));

    if (filters.bedrooms)
      queries.push(
        Query.greaterThanEqual("bedrooms", Number(filters.bedrooms)),
      );
    if (filters.bathrooms)
      queries.push(
        Query.greaterThanEqual("bathrooms", Number(filters.bathrooms)),
      );
    if (filters.parkingSpaces)
      queries.push(
        Query.greaterThanEqual("parkingSpaces", Number(filters.parkingSpaces)),
      );
    if (filters.furnished)
      queries.push(Query.equal("furnished", filters.furnished));
    if (filters.petsAllowed) queries.push(Query.equal("petsAllowed", true));

    if (filters.amenities && Array.isArray(filters.amenities)) {
      filters.amenities.forEach((amenity) => {
        if (amenity && String(amenity).trim()) {
          queries.push(Query.contains("amenities", String(amenity).trim()));
        }
      });
    }

    if (filters.featured) queries.push(Query.equal("featured", true));

    if (!filters.search) {
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
    }

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      queries,
    });

    return {
      ...response,
      documents: (response.documents || []).map((doc) =>
        normalizeResourceDocument(doc),
      ),
    };
  },

  async getPublicBySlug(slug) {
    ensureAppwriteConfigured();
    const { resourcesCollectionId } = getCollectionConfig();
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      queries: [
        Query.equal("slug", slug),
        Query.equal("status", "published"),
        Query.equal("enabled", true),
        Query.limit(1),
      ],
    });

    return response.documents?.[0]
      ? normalizeResourceDocument(response.documents[0])
      : null;
  },

  async getById(resourceId) {
    ensureAppwriteConfigured();
    const { resourcesCollectionId } = getCollectionConfig();
    const doc = await databases.getDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      documentId: resourceId,
    });
    return normalizeResourceDocument(doc);
  },

  async listMine(_userId, { ownerUserId = "", status = "" } = {}) {
    ensureAppwriteConfigured();
    const { resourcesCollectionId } = getCollectionConfig();
    const queries = [
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ];

    if (ownerUserId) queries.push(Query.equal("ownerUserId", ownerUserId));
    if (status) queries.push(Query.equal("status", status));

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      queries,
    });

    return {
      ...response,
      documents: (response.documents || []).map((doc) =>
        normalizeResourceDocument(doc),
      ),
    };
  },

  async listByResponsible(responsibleUserId) {
    ensureAppwriteConfigured();
    if (!responsibleUserId) return { documents: [], total: 0 };

    const { resourcesCollectionId } = getCollectionConfig();
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      queries: [
        Query.equal("enabled", true),
        Query.equal("ownerUserId", responsibleUserId),
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ],
    });

    return {
      ...response,
      documents: (response.documents || []).map((doc) =>
        normalizeResourceDocument(doc),
      ),
    };
  },

  async updateResponsibleAgent(resourceId, newOwnerUserId) {
    ensureAppwriteConfigured();
    const normalizedId = String(newOwnerUserId || "").trim();
    if (!normalizedId) {
      throw new Error("Se requiere un usuario responsable valido.");
    }

    const { resourcesCollectionId } = getCollectionConfig();
    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      documentId: resourceId,
      data: { ownerUserId: normalizedId },
    });
  },

  async create(userId, payload) {
    ensureAppwriteConfigured();
    const { resourcesCollectionId, useCanonicalResources } = getCollectionConfig();
    const normalized = normalizeResourceInput(payload, {
      forUpdate: false,
      target: useCanonicalResources ? "canonical" : "legacy",
    });

    const data = {
      ...normalized,
      ownerUserId: userId,
      views: 0,
      contactCount: 0,
      reservationCount: 0,
    };

    const created = await databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      documentId: ID.unique(),
      data,
    });

    return normalizeResourceDocument(created);
  },

  async update(resourceId, _userId, payload) {
    ensureAppwriteConfigured();
    const { resourcesCollectionId, useCanonicalResources } = getCollectionConfig();
    const needsResourceContext = [
      "resourceType",
      "category",
      "propertyType",
      "commercialMode",
      "operationType",
      "pricingModel",
      "pricePerUnit",
      "bookingType",
    ].some((key) => hasOwn(payload, key));

    const existing = needsResourceContext
      ? await databases.getDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: resourcesCollectionId,
          documentId: resourceId,
        })
      : {};

    const normalized = normalizeResourceInput(payload, {
      forUpdate: true,
      target: useCanonicalResources ? "canonical" : "legacy",
      existing,
    });

    const updated = await databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      documentId: resourceId,
      data: normalized,
    });

    return normalizeResourceDocument(updated);
  },

  async softDelete(resourceId) {
    ensureAppwriteConfigured();
    const { resourcesCollectionId } = getCollectionConfig();
    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: resourcesCollectionId,
      documentId: resourceId,
      data: {
        enabled: false,
        status: "inactive",
      },
    });
  },

  async listImages(resourceId) {
    ensureAppwriteConfigured();
    const {
      resourceImagesCollectionId,
      useCanonicalResources,
    } = getCollectionConfig();
    const normalizedId = String(resourceId || "").trim();
    if (!normalizedId) return [];

    let response;
    try {
      response = await listImagesWithFallbackField({
        databaseId: env.appwrite.databaseId,
        collectionId: resourceImagesCollectionId,
        resourceId: normalizedId,
        idField: useCanonicalResources ? "resourceId" : "propertyId",
      });
    } catch {
      response = await listImagesWithFallbackField({
        databaseId: env.appwrite.databaseId,
        collectionId: resourceImagesCollectionId,
        resourceId: normalizedId,
        idField: useCanonicalResources ? "propertyId" : "resourceId",
      });
    }

    return (response.documents || []).map((doc) => ({
      ...doc,
      resourceId: String(doc.resourceId || doc.propertyId || normalizedId),
      propertyId: String(doc.propertyId || doc.resourceId || normalizedId),
      url: toPreviewUrl(doc.fileId),
    }));
  },

  async uploadPropertyImages(
    resourceId,
    files,
    { title = "", startingSortOrder = 0, existingFileIds = [] } = {},
  ) {
    ensureAppwriteConfigured();
    const {
      resourceImagesBucketId,
      resourceImagesCollectionId,
      resourcesCollectionId,
      useCanonicalResources,
    } = getCollectionConfig();

    if (!resourceImagesBucketId) {
      throw new Error(
        "No esta configurada APPWRITE_BUCKET_RESOURCE_IMAGES_ID/PROPERTY_IMAGES_ID.",
      );
    }
    if (!resourceImagesCollectionId) {
      throw new Error(
        "No esta configurada APPWRITE_COLLECTION_RESOURCE_IMAGES_ID/PROPERTY_IMAGES_ID.",
      );
    }

    const normalizedResourceId = String(resourceId || "").trim();
    if (!normalizedResourceId) {
      throw new Error("Resource ID invalido para subir imagenes.");
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
        bucketId: resourceImagesBucketId,
        fileId: ID.unique(),
        file,
      });

      try {
        const imageData = {
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

        const imageDoc = await createImageDocWithFallbackField({
          databaseId: env.appwrite.databaseId,
          collectionId: resourceImagesCollectionId,
          resourceId: normalizedResourceId,
          data: imageData,
          preferredIdField: useCanonicalResources ? "resourceId" : "propertyId",
        });

        uploadedImages.push({
          ...imageDoc,
          resourceId: String(
            imageDoc.resourceId || imageDoc.propertyId || normalizedResourceId,
          ),
          propertyId: String(
            imageDoc.propertyId || imageDoc.resourceId || normalizedResourceId,
          ),
          url: toPreviewUrl(uploadedFile.$id),
        });
      } catch (error) {
        await storage
          .deleteFile({
            bucketId: resourceImagesBucketId,
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
        collectionId: resourcesCollectionId,
        documentId: normalizedResourceId,
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
