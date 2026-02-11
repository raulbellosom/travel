import env from "../env";
import { ensureAppwriteConfigured } from "../api/appwriteClient";
import { executeJsonFunction } from "../utils/functions";

export const STAFF_ROLES = [
  "staff_manager",
  "staff_editor",
  "staff_support",
];

export const staffService = {
  async createStaffUser({ fullName, email, password, role }) {
    ensureAppwriteConfigured();

    const functionId = env.appwrite.functions.staffUserManagement;
    if (!functionId) {
      throw new Error(
        "No esta configurada APPWRITE_FUNCTION_STAFF_USER_MANAGEMENT_ID."
      );
    }

    return executeJsonFunction(functionId, {
      action: "create_staff",
      fullName,
      email,
      password,
      role,
    });
  },
};
