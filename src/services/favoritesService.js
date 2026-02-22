import env from "../env";
import { databases, ensureAppwriteConfigured, ID, Query } from "../api/appwriteClient";

const normalizeId = (value) => String(value || "").trim();

const getCollectionId = () => env.appwrite.collections.favorites || "favorites";

const listFavoriteDocs = async ({
  userId,
  resourceId = "",
  limit = 100,
} = {}) => {
  const queries = [Query.equal("userId", normalizeId(userId)), Query.limit(limit)];
  const normalizedResourceId = normalizeId(resourceId);

  if (normalizedResourceId) {
    queries.push(Query.equal("resourceId", normalizedResourceId));
  }

  return databases.listDocuments({
    databaseId: env.appwrite.databaseId,
    collectionId: getCollectionId(),
    queries,
  });
};

export const favoritesService = {
  async listByUser(userId, { limit = 100 } = {}) {
    ensureAppwriteConfigured();
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];

    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: getCollectionId(),
      queries: [
        Query.equal("userId", normalizedUserId),
        Query.orderDesc("$createdAt"),
        Query.limit(Math.max(1, Number(limit) || 100)),
      ],
    });

    return response.documents || [];
  },

  async getFavorite(userId, resourceId) {
    ensureAppwriteConfigured();
    const normalizedUserId = normalizeId(userId);
    const normalizedResourceId = normalizeId(resourceId);
    if (!normalizedUserId || !normalizedResourceId) return null;

    const response = await listFavoriteDocs({
      userId: normalizedUserId,
      resourceId: normalizedResourceId,
      limit: 10,
    });

    const docs = response.documents || [];
    return docs.find((doc) => doc.enabled !== false) || null;
  },

  async isFavorite(userId, resourceId) {
    const doc = await this.getFavorite(userId, resourceId);
    return Boolean(doc?.$id);
  },

  async addFavorite({
    userId,
    resourceId,
    resourceSlug = "",
    resourceTitle = "",
    resourceOwnerUserId = "",
  }) {
    ensureAppwriteConfigured();
    const normalizedUserId = normalizeId(userId);
    const normalizedResourceId = normalizeId(resourceId);
    if (!normalizedUserId || !normalizedResourceId) {
      throw new Error("Missing favorite identifiers.");
    }

    const existing = await this.getFavorite(normalizedUserId, normalizedResourceId);
    if (existing?.$id) return existing;

    const payload = {
      userId: normalizedUserId,
      resourceId: normalizedResourceId,
      resourceSlug: String(resourceSlug || "").trim(),
      resourceTitle: String(resourceTitle || "").trim(),
      resourceOwnerUserId: normalizeId(resourceOwnerUserId),
    }

    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: getCollectionId(),
      documentId: ID.unique(),
      data: payload,
    });
  },

  async removeFavorite(userId, resourceId) {
    ensureAppwriteConfigured();
    const normalizedUserId = normalizeId(userId);
    const normalizedResourceId = normalizeId(resourceId);
    if (!normalizedUserId || !normalizedResourceId) return null;

    const response = await listFavoriteDocs({
      userId: normalizedUserId,
      resourceId: normalizedResourceId,
      limit: 50,
    });
    const docs = response.documents || [];
    if (docs.length === 0) return null;

    await Promise.all(
      docs.map((doc) =>
        databases.deleteDocument({
          databaseId: env.appwrite.databaseId,
          collectionId: getCollectionId(),
          documentId: doc.$id,
        }),
      ),
    );

    return { deleted: docs.length };
  },

  async toggleFavorite({
    userId,
    resourceId,
    resourceSlug = "",
    resourceTitle = "",
    resourceOwnerUserId = "",
  }) {
    const current = await this.getFavorite(userId, resourceId);
    if (current?.$id) {
      await this.removeFavorite(userId, resourceId);
      return { isFavorite: false };
    }

    const doc = await this.addFavorite({
      userId,
      resourceId,
      resourceSlug,
      resourceTitle,
      resourceOwnerUserId,
    });
    return { isFavorite: true, favorite: doc };
  },
};

export default favoritesService;
