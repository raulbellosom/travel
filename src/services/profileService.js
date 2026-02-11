import env from "../env";
import {
  databases,
  ensureAppwriteConfigured,
  ID,
  Query,
  storage,
} from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

export const profileService = {
  async getProfile(userId) {
    ensureAppwriteConfigured();
    return databases.getDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.users,
      documentId: userId,
    });
  },

  async updateProfile(userId, patch) {
    ensureAppwriteConfigured();

    return databases.updateDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.users,
      documentId: userId,
      data: patch,
    });
  },

  async getPreferencesByUserId(userId) {
    ensureAppwriteConfigured();
    const response = await databases.listDocuments({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.userPreferences,
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });

    return response.documents?.[0] || null;
  },

  async upsertPreferences(userId, patch) {
    ensureAppwriteConfigured();
    const existing = await this.getPreferencesByUserId(userId);
    const data = {
      userId,
      ...patch,
      enabled: true,
    };

    if (existing) {
      return databases.updateDocument({
        databaseId: env.appwrite.databaseId,
        collectionId: env.appwrite.collections.userPreferences,
        documentId: existing.$id,
        data,
      });
    }

    return databases.createDocument({
      databaseId: env.appwrite.databaseId,
      collectionId: env.appwrite.collections.userPreferences,
      documentId: ID.unique(),
      data,
    });
  },

  async syncUserProfile(patch) {
    ensureAppwriteConfigured();
    const functionId = env.appwrite.functions.syncUserProfile;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_SYNC_USER_PROFILE_ID."
      );
    }
    return executeJsonFunction(functionId, patch);
  },

  async uploadAvatar(file) {
    ensureAppwriteConfigured();
    if (!env.appwrite.buckets.avatars) {
      throw new Error("No esta configurada APPWRITE_BUCKET_AVATARS_ID.");
    }

    return storage.createFile({
      bucketId: env.appwrite.buckets.avatars,
      fileId: ID.unique(),
      file,
    });
  },

  getAvatarViewUrl(fileId) {
    if (!fileId || !env.appwrite.buckets.avatars) return "";
    return storage.getFileView({
      bucketId: env.appwrite.buckets.avatars,
      fileId,
    });
  },

  async deleteAvatar(fileId) {
    ensureAppwriteConfigured();
    if (!fileId || !env.appwrite.buckets.avatars) return;

    return storage.deleteFile({
      bucketId: env.appwrite.buckets.avatars,
      fileId,
    });
  },
};
