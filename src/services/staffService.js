import env from "../env";
import { ensureAppwriteConfigured } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

export const STAFF_ROLES = [
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
];

export const staffService = {
  async execute(payload) {
    ensureAppwriteConfigured();

    const functionId = env.appwrite.functions.staffUserManagement;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID."
      );
    }

    return executeJsonFunction(functionId, payload);
  },

  async createStaffUser({
    firstName,
    lastName,
    email,
    password,
    role,
    scopes = [],
    avatarFileId = "",
  }) {
    return this.execute({
      action: "create_staff",
      firstName,
      lastName,
      email,
      password,
      role,
      scopes,
      avatarFileId,
    });
  },

  async listStaff() {
    const result = await this.execute({
      action: "list_staff",
    });
    return result?.body?.data?.documents || [];
  },

  async updateStaff({
    userId,
    firstName,
    lastName,
    email,
    role,
    scopes,
    avatarFileId,
  }) {
    const payload = {
      action: "update_staff",
      targetUserId: userId,
      role,
      scopes,
    };

    if (firstName !== undefined) {
      payload.firstName = firstName;
    }

    if (lastName !== undefined) {
      payload.lastName = lastName;
    }

    if (email !== undefined) {
      payload.email = email;
    }

    if (avatarFileId !== undefined) {
      payload.avatarFileId = avatarFileId;
    }

    return this.execute({
      ...payload,
    });
  },

  async setStaffEnabled({ userId, enabled }) {
    return this.execute({
      action: "set_staff_enabled",
      targetUserId: userId,
      enabled: Boolean(enabled),
    });
  },
};
