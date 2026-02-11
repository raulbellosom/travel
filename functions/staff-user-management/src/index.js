import { Client, Databases, ID, Permission, Query, Role, Users } from "node-appwrite";
import {
  getAuthenticatedUserId,
  getRequestId,
  isMethodAllowed,
  json,
  parseBody,
} from "./_request.js";

const ALLOWED_STAFF_ROLES = new Set([
  "staff_manager",
  "staff_editor",
  "staff_support",
]);

const ALLOWED_ACTIONS = new Set(["create_staff"]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const getConfig = () => ({
  endpoint:
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  preferencesCollectionId:
    process.env.APPWRITE_COLLECTION_USER_PREFERENCES_ID || "user_preferences",
  activityLogsCollectionId:
    process.env.APPWRITE_COLLECTION_ACTIVITY_LOGS_ID || "",
});

const normalize = (value, max = 0) => {
  const str = String(value ?? "").trim();
  return max > 0 ? str.slice(0, max) : str;
};

const normalizeEmail = (value) => normalize(value, 254).toLowerCase();

const isValidEmail = (value) => EMAIL_REGEX.test(String(value || ""));

const splitName = (name) => {
  const normalized = normalize(name).replace(/\s+/g, " ");
  if (!normalized) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
};

const getPasswordChecks = (password) => {
  const raw = String(password || "");
  const hasMinLength = raw.length >= 8;
  const hasLower = /[a-z]/.test(raw);
  const hasUpper = /[A-Z]/.test(raw);
  const hasNumber = /[0-9]/.test(raw);
  const hasSymbol = /[^A-Za-z0-9]/.test(raw);
  const categoryCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  return {
    hasMinLength,
    categoryCount,
  };
};

const isStrongPassword = (password) => {
  const checks = getPasswordChecks(password);
  return checks.hasMinLength && checks.categoryCount >= 3;
};

const ensureActionAllowed = (action) => ALLOWED_ACTIONS.has(String(action || "").trim());

const safeJsonString = (value, maxLength = 20000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const safeActivityLog = async ({ db, config, data, logger }) => {
  if (!config.activityLogsCollectionId) return;
  try {
    await db.createDocument(
      config.databaseId,
      config.activityLogsCollectionId,
      ID.unique(),
      data,
    );
  } catch (err) {
    logger(`activity_logs write skipped: ${err.message}`);
  }
};

const createAuthUserCompat = async ({ users, email, password, fullName }) => {
  try {
    return await users.create({
      userId: ID.unique(),
      email,
      password,
      name: fullName,
    });
  } catch (error) {
    // Fallback for SDK variants that still expect positional args.
    return users.create(ID.unique(), email, undefined, password, fullName);
  }
};

const waitForProfileDocument = async ({
  db,
  config,
  userId,
  attempts = 10,
  waitMs = 250,
}) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await db.getDocument(config.databaseId, config.usersCollectionId, userId);
    } catch (error) {
      const maybeNotFound = Number(error?.code) === 404;
      if (!maybeNotFound || i === attempts - 1) {
        throw error;
      }
      await sleep(waitMs);
    }
  }
  return null;
};

const ensurePreferences = async ({ db, config, userId }) => {
  const found = await db.listDocuments(
    config.databaseId,
    config.preferencesCollectionId,
    [Query.equal("userId", userId), Query.limit(1)],
  );

  if (found.total > 0) return found.documents[0];

  return db.createDocument(
    config.databaseId,
    config.preferencesCollectionId,
    ID.unique(),
    {
      userId,
      theme: "system",
      locale: "es",
      brandPrimaryColor: "#0F172A",
      brandSecondaryColor: "#16A34A",
      brandFontHeading: "Poppins",
      brandFontBody: "Inter",
      enabled: true,
    },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))],
  );
};

const createStaff = async ({
  body,
  actorUserId,
  actorRole,
  users,
  db,
  config,
  log,
}) => {
  const fullName = normalize(body.fullName || body.name, 160).replace(/\s+/g, " ");
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const role = normalize(body.role, 40);

  if (!fullName || !email || !password || !role) {
    return {
      status: 400,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "fullName, email, password and role are required",
      },
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid email format",
      },
    };
  }

  if (!ALLOWED_STAFF_ROLES.has(role)) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: `role must be one of: ${Array.from(ALLOWED_STAFF_ROLES).join(", ")}`,
      },
    };
  }

  if (!isStrongPassword(password)) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message:
          "Password must have at least 8 characters and 3 categories (upper/lower/number/symbol)",
      },
    };
  }

  const { firstName, lastName } = splitName(fullName);
  const scopesJson =
    Array.isArray(body.scopes) && body.scopes.length > 0
      ? safeJsonString(body.scopes, 4000)
      : "[]";

  let createdUserId = "";
  let profileTouched = false;

  try {
    const createdAuthUser = await createAuthUserCompat({
      users,
      email,
      password,
      fullName,
    });
    createdUserId = String(createdAuthUser?.$id || createdAuthUser?.id || "");

    if (!createdUserId) {
      throw new Error("Unable to resolve created user id");
    }

    try {
      await waitForProfileDocument({
        db,
        config,
        userId: createdUserId,
      });
    } catch (profileWaitError) {
      const notFound = Number(profileWaitError?.code) === 404;
      if (!notFound) throw profileWaitError;

      const baseProfileData = {
        email,
        firstName: firstName || "Staff",
        lastName: lastName || "",
        phone: "",
        role,
        scopesJson,
        isHidden: false,
        enabled: true,
      };

      const profilePermissions = [
        Permission.read(Role.user(createdUserId)),
        Permission.update(Role.user(createdUserId)),
        Permission.delete(Role.user(createdUserId)),
        Permission.read(Role.user(actorUserId)),
      ];

      try {
        await db.createDocument(
          config.databaseId,
          config.usersCollectionId,
          createdUserId,
          baseProfileData,
          profilePermissions,
        );
      } catch (createProfileErr) {
        const authRequired = String(createProfileErr?.message || "")
          .toLowerCase()
          .includes("authid");
        if (!authRequired) throw createProfileErr;

        await db.createDocument(
          config.databaseId,
          config.usersCollectionId,
          createdUserId,
          {
            ...baseProfileData,
            authId: createdUserId,
          },
          profilePermissions,
        );
      }

      profileTouched = true;
    }

    const profilePatch = {
      email,
      firstName: firstName || "Staff",
      lastName: lastName || "",
      role,
      scopesJson,
      enabled: true,
      isHidden: false,
    };

    await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      createdUserId,
      profilePatch,
      [
        Permission.read(Role.user(createdUserId)),
        Permission.update(Role.user(createdUserId)),
        Permission.delete(Role.user(createdUserId)),
        Permission.read(Role.user(actorUserId)),
      ],
    );
    profileTouched = true;

    await ensurePreferences({ db, config, userId: createdUserId });

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId,
        actorRole,
        action: "staff.create",
        entityType: "users",
        entityId: createdUserId,
        afterData: safeJsonString({
          email,
          role,
          scopesJson,
          enabled: true,
        }),
        severity: "info",
      },
    });

    return {
      status: 201,
      body: {
        ok: true,
        success: true,
        code: "STAFF_CREATED",
        message: "Staff user created",
        data: {
          userId: createdUserId,
          email,
          role,
        },
      },
    };
  } catch (error) {
    const alreadyExists =
      Number(error?.code) === 409 ||
      String(error?.message || "").toLowerCase().includes("already exists");
    if (alreadyExists) {
      return {
        status: 409,
        body: {
          ok: false,
          success: false,
          code: "STAFF_ALREADY_EXISTS",
          message: "A user with this email already exists",
        },
      };
    }

    // Cleanup only when we created auth user but profile was never persisted.
    if (createdUserId && !profileTouched) {
      try {
        await users.delete(createdUserId);
      } catch {
        // no-op
      }
    }

    throw error;
  }
};

export default async ({ req, res, log, error }) => {
  if (!isMethodAllowed(req, ["POST"])) {
    return json(res, 405, {
      ok: false,
      success: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST",
    });
  }

  const config = getConfig();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return json(res, 500, {
      ok: false,
      success: false,
      code: "ENV_MISSING",
      message: "Missing Appwrite credentials",
    });
  }

  const actorUserId = getAuthenticatedUserId(req);
  if (!actorUserId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "UNAUTHORIZED",
      message: "Missing authenticated user context",
    });
  }

  const body = parseBody(req);
  const action = normalize(body.action, 40);
  if (!ensureActionAllowed(action)) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: `Unsupported action: ${action || "-"}`,
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);
  const users = new Users(client);

  try {
    const actorProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );

    const actorRole = normalize(actorProfile.role, 40);
    const actorEnabled = actorProfile.enabled !== false;
    const isAllowedActor = actorEnabled && (actorRole === "owner" || actorRole === "root");

    if (!isAllowedActor) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Only owner or root can manage staff users",
      });
    }

    if (action === "create_staff") {
      const result = await createStaff({
        body,
        actorUserId,
        actorRole,
        users,
        db,
        config,
        log,
      });
      return json(res, result.status, result.body);
    }

    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: `Unsupported action: ${action}`,
    });
  } catch (err) {
    const requestId = getRequestId(req);
    error(`staff-user-management requestId=${requestId} failed: ${err.message}`);
    log(err.stack || "");
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
