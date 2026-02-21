import {
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Storage,
  Users,
} from "node-appwrite";
import {
  getAuthenticatedUserId,
  getRequestId,
  isMethodAllowed,
  json,
  parseBody,
} from "./_request.js";

const ALLOWED_STAFF_ROLES = new Set([
  "root",
  "owner",
  "staff_manager",
  "staff_editor",
  "staff_support",
]);

const STAFF_ROLE_LIST = Array.from(ALLOWED_STAFF_ROLES);
const ALLOWED_ACTIONS = new Set([
  "create_staff",
  "list_staff",
  "update_staff",
  "set_staff_enabled",
]);

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
  avatarsBucketId: process.env.APPWRITE_BUCKET_AVATARS_ID || "",
});

const normalize = (value, max = 0) => {
  const str = String(value ?? "").trim();
  return max > 0 ? str.slice(0, max) : str;
};

const normalizeEmail = (value) => normalize(value, 254).toLowerCase();
const isValidEmail = (value) => EMAIL_REGEX.test(String(value || ""));
const normalizeBool = (value) =>
  value === true || String(value || "").toLowerCase() === "true";
const normalizeFileId = (value) => normalize(value, 64);

const splitName = (name) => {
  const normalized = normalize(name).replace(/\s+/g, " ");
  if (!normalized) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
};

const parseScopes = (input) => {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((scope) => normalize(scope, 80))
        .filter(Boolean)
    ),
  ).slice(0, 100);
};

const parseScopesJson = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return parseScopes(value);
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return parseScopes(parsed);
  } catch {
    return [];
  }
};

const hasScope = (scopes, scope) => {
  const normalized = normalize(scope, 80);
  if (!normalized) return true;
  const scopeSet = new Set(parseScopes(scopes));
  return scopeSet.has("*") || scopeSet.has(normalized);
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
  } catch {
    // Fallback for SDK variants that still expect positional args.
    return users.create(ID.unique(), email, undefined, password, fullName);
  }
};

const getUserCompat = async ({ users, userId }) => {
  try {
    return await users.get({
      userId,
    });
  } catch {
    return users.get(userId);
  }
};

const updateAuthPrefsCompat = async ({ users, userId, prefs }) => {
  try {
    return await users.updatePrefs({
      userId,
      prefs,
    });
  } catch {
    return users.updatePrefs(userId, prefs);
  }
};

const updateAuthNameCompat = async ({ users, userId, name }) => {
  try {
    return await users.updateName({
      userId,
      name,
    });
  } catch {
    return users.updateName(userId, name);
  }
};

const updateAuthEmailCompat = async ({ users, userId, email }) => {
  try {
    return await users.updateEmail({
      userId,
      email,
    });
  } catch {
    return users.updateEmail(userId, email);
  }
};

const getStorageFileCompat = async ({ storage, bucketId, fileId }) => {
  try {
    return await storage.getFile({
      bucketId,
      fileId,
    });
  } catch {
    return storage.getFile(bucketId, fileId);
  }
};

const deleteStorageFileCompat = async ({ storage, bucketId, fileId }) => {
  try {
    return await storage.deleteFile({
      bucketId,
      fileId,
    });
  } catch {
    return storage.deleteFile(bucketId, fileId);
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
      enabled: true,
    },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))],
  );
};

const isProtectedRole = (role) => ["root", "owner"].includes(normalize(role, 40).toLowerCase());

const isQueryCompatibilityError = (error) => {
  const code = Number(error?.code);
  if (code === 400) return true;
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("invalid query") ||
    message.includes("attribute") ||
    message.includes("index")
  );
};

const getStaffProfile = async ({ db, config, targetUserId }) => {
  const target = await db.getDocument(
    config.databaseId,
    config.usersCollectionId,
    targetUserId,
  );
  const targetRole = normalize(target.role, 40).toLowerCase();
  if (isProtectedRole(targetRole)) {
    const err = new Error("Root/owner management is blocked");
    err.code = 403;
    throw err;
  }
  if (!ALLOWED_STAFF_ROLES.has(targetRole)) {
    const err = new Error("Target user is not a staff account");
    err.code = 422;
    throw err;
  }
  return target;
};

const listStaff = async ({ db, users, config }) => {
  const listQueriesStrict = [
    Query.equal("role", STAFF_ROLE_LIST),
    Query.equal("isHidden", false),
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ];
  const listQueriesRoleOnly = [
    Query.equal("role", STAFF_ROLE_LIST),
    Query.orderDesc("$createdAt"),
    Query.limit(200),
  ];
  const listQueriesFallback = [Query.orderDesc("$createdAt"), Query.limit(200)];

  let response;
  try {
    response = await db.listDocuments(
      config.databaseId,
      config.usersCollectionId,
      listQueriesStrict,
    );
  } catch (strictError) {
    if (!isQueryCompatibilityError(strictError)) throw strictError;
    try {
      response = await db.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        listQueriesRoleOnly,
      );
    } catch (roleOnlyError) {
      if (!isQueryCompatibilityError(roleOnlyError)) throw roleOnlyError;
      response = await db.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        listQueriesFallback,
      );
    }
  }

  const visibleStaff = (response.documents || []).filter((doc) => {
    const role = normalize(doc?.role, 40).toLowerCase();
    return ALLOWED_STAFF_ROLES.has(role) && doc?.isHidden !== true;
  });

  return Promise.all(
    visibleStaff.map(async (doc) => {
      const authUser = await getUserCompat({ users, userId: doc.$id }).catch(() => null);
      return {
        $id: doc.$id,
        email: doc.email || authUser?.email || "",
        firstName: doc.firstName,
        lastName: doc.lastName,
        role: doc.role,
        scopesJson: doc.scopesJson || "[]",
        enabled: doc.enabled !== false,
        avatarFileId: normalizeFileId(doc.avatarFileId || authUser?.prefs?.avatarFileId),
        avatarUpdatedAt: normalize(authUser?.prefs?.avatarUpdatedAt, 48),
        $createdAt: doc.$createdAt,
      };
    }),
  );
};

const createStaff = async ({
  body,
  actorUserId,
  actorRole,
  users,
  storage,
  db,
  config,
  log,
}) => {
  const requestedFirstName = normalize(body.firstName, 80).replace(/\s+/g, " ");
  const requestedLastName = normalize(body.lastName, 80).replace(/\s+/g, " ");
  const legacyFullName = normalize(body.fullName || body.name, 160).replace(/\s+/g, " ");
  const legacyNameParts = splitName(legacyFullName);
  const firstName = requestedFirstName || legacyNameParts.firstName;
  const lastName = requestedLastName || legacyNameParts.lastName;
  const fullName = normalize(`${firstName} ${lastName}`, 160).replace(/\s+/g, " ");
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const role = normalize(body.role, 40).toLowerCase();
  const scopes = parseScopes(body.scopes);
  const avatarFileId = normalizeFileId(body.avatarFileId);

  if (!firstName || !lastName || !email || !password || !role) {
    return {
      status: 400,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "firstName, lastName, email, password and role are required",
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
        message: `role must be one of: ${STAFF_ROLE_LIST.join(", ")}`,
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

  if (avatarFileId) {
    if (!config.avatarsBucketId) {
      return {
        status: 422,
        body: {
          ok: false,
          success: false,
          code: "VALIDATION_ERROR",
          message: "avatars bucket is not configured",
        },
      };
    }

    try {
      await getStorageFileCompat({
        storage,
        bucketId: config.avatarsBucketId,
        fileId: avatarFileId,
      });
    } catch {
      return {
        status: 422,
        body: {
          ok: false,
          success: false,
          code: "VALIDATION_ERROR",
          message: "Invalid avatar file id",
        },
      };
    }
  }

  const scopesJson = safeJsonString(scopes, 4000);
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

      await db.createDocument(
        config.databaseId,
        config.usersCollectionId,
        createdUserId,
        {
          email,
          firstName: firstName || "Staff",
          lastName: lastName || "",
          phone: "",
          role,
          scopesJson,
          isHidden: false,
          enabled: true,
        },
        [
          Permission.read(Role.user(createdUserId)),
          Permission.update(Role.user(createdUserId)),
          Permission.delete(Role.user(createdUserId)),
          Permission.read(Role.user(actorUserId)),
        ],
      );
      profileTouched = true;
    }

    await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      createdUserId,
      {
        email,
        firstName: firstName || "Staff",
        lastName: lastName || "",
        role,
        scopesJson,
        enabled: true,
        isHidden: false,
      },
      [
        Permission.read(Role.user(createdUserId)),
        Permission.update(Role.user(createdUserId)),
        Permission.delete(Role.user(createdUserId)),
        Permission.read(Role.user(actorUserId)),
      ],
    );
    profileTouched = true;

    await ensurePreferences({ db, config, userId: createdUserId });
    if (avatarFileId) {
      const authUser = await getUserCompat({ users, userId: createdUserId });
      const nextPrefs = {
        ...(authUser?.prefs || {}),
        avatarFileId,
        avatarUpdatedAt: new Date().toISOString(),
      };
      await updateAuthPrefsCompat({
        users,
        userId: createdUserId,
        prefs: nextPrefs,
      });
    }

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
          scopes,
          avatarFileId,
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
          scopes,
          avatarFileId,
          enabled: true,
        },
      },
    };
  } catch (createErr) {
    const alreadyExists =
      Number(createErr?.code) === 409 ||
      String(createErr?.message || "").toLowerCase().includes("already exists");
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

    throw createErr;
  }
};

const updateStaff = async ({
  body,
  actorUserId,
  actorRole,
  users,
  storage,
  db,
  config,
  log,
}) => {
  const targetUserId = normalize(body.targetUserId || body.userId, 64);
  const role = normalize(body.role, 40).toLowerCase();
  const scopes = parseScopes(body.scopes);
  const hasFirstNamePatch = Object.prototype.hasOwnProperty.call(body || {}, "firstName");
  const hasLastNamePatch = Object.prototype.hasOwnProperty.call(body || {}, "lastName");
  const hasEmailPatch = Object.prototype.hasOwnProperty.call(body || {}, "email");
  const hasAvatarPatch = Object.prototype.hasOwnProperty.call(body || {}, "avatarFileId");
  const firstNameInput = normalize(body.firstName, 80).replace(/\s+/g, " ");
  const lastNameInput = normalize(body.lastName, 80).replace(/\s+/g, " ");
  const emailInput = normalizeEmail(body.email);
  const avatarFileId = normalizeFileId(body.avatarFileId);

  if (!targetUserId || !role) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "targetUserId and role are required",
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
        message: `role must be one of: ${STAFF_ROLE_LIST.join(", ")}`,
      },
    };
  }

  if (hasEmailPatch && !isValidEmail(emailInput)) {
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

  if (hasAvatarPatch && avatarFileId) {
    if (!config.avatarsBucketId) {
      return {
        status: 422,
        body: {
          ok: false,
          success: false,
          code: "VALIDATION_ERROR",
          message: "avatars bucket is not configured",
        },
      };
    }

    try {
      await getStorageFileCompat({
        storage,
        bucketId: config.avatarsBucketId,
        fileId: avatarFileId,
      });
    } catch {
      return {
        status: 422,
        body: {
          ok: false,
          success: false,
          code: "VALIDATION_ERROR",
          message: "Invalid avatar file id",
        },
      };
    }
  }

  const target = await getStaffProfile({ db, config, targetUserId });
  const authUser = await getUserCompat({ users, userId: targetUserId }).catch(() => null);
  const currentFirstName = normalize(target.firstName, 80).replace(/\s+/g, " ");
  const currentLastName = normalize(target.lastName, 80).replace(/\s+/g, " ");
  const currentEmail = normalizeEmail(target.email || authUser?.email);
  const nextFirstName = hasFirstNamePatch ? firstNameInput : currentFirstName;
  const nextLastName = hasLastNamePatch ? lastNameInput : currentLastName;
  const nextEmail = hasEmailPatch ? emailInput : currentEmail;

  if ((hasFirstNamePatch || hasLastNamePatch) && (!nextFirstName || !nextLastName)) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "firstName and lastName are required",
      },
    };
  }

  if ((hasFirstNamePatch || hasLastNamePatch) && (nextFirstName.length < 2 || nextLastName.length < 2)) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "firstName and lastName must have at least 2 characters",
      },
    };
  }

  const shouldUpdateAuthEmail = hasEmailPatch && nextEmail && nextEmail !== currentEmail;
  const nextFullName = normalize(`${nextFirstName} ${nextLastName}`, 160).replace(/\s+/g, " ");
  const currentFullName = normalize(authUser?.name || `${currentFirstName} ${currentLastName}`, 160).replace(/\s+/g, " ");
  const shouldUpdateAuthName =
    (hasFirstNamePatch || hasLastNamePatch) &&
    nextFullName &&
    nextFullName !== currentFullName;

  if (shouldUpdateAuthEmail) {
    try {
      await updateAuthEmailCompat({
        users,
        userId: targetUserId,
        email: nextEmail,
      });
    } catch (updateEmailErr) {
      const alreadyExists =
        Number(updateEmailErr?.code) === 409 ||
        String(updateEmailErr?.message || "").toLowerCase().includes("already exists");
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
      throw updateEmailErr;
    }
  }

  if (shouldUpdateAuthName) {
    await updateAuthNameCompat({
      users,
      userId: targetUserId,
      name: nextFullName,
    }).catch(() => {});
  }

  const currentAvatarFileId = normalizeFileId(authUser?.prefs?.avatarFileId);
  const before = {
    firstName: currentFirstName,
    lastName: currentLastName,
    email: currentEmail,
    role: target.role,
    scopesJson: target.scopesJson || "[]",
    enabled: target.enabled !== false,
    avatarFileId: currentAvatarFileId,
  };

  const patch = {
    role,
    scopesJson: safeJsonString(scopes, 4000),
  };

  if (hasFirstNamePatch) {
    patch.firstName = nextFirstName;
  }

  if (hasLastNamePatch) {
    patch.lastName = nextLastName;
  }

  if (hasEmailPatch) {
    patch.email = nextEmail;
  }

  const updated = await db.updateDocument(
    config.databaseId,
    config.usersCollectionId,
    targetUserId,
    patch,
  );

  let nextAvatarFileId = currentAvatarFileId;
  if (hasAvatarPatch) {
    nextAvatarFileId = avatarFileId;
    const nextPrefs = {
      ...(authUser?.prefs || {}),
      avatarFileId,
      avatarUpdatedAt: avatarFileId ? new Date().toISOString() : "",
    };
    await updateAuthPrefsCompat({
      users,
      userId: targetUserId,
      prefs: nextPrefs,
    });

    const shouldDeletePrevious =
      currentAvatarFileId &&
      currentAvatarFileId !== avatarFileId &&
      config.avatarsBucketId;
    if (shouldDeletePrevious) {
      await deleteStorageFileCompat({
        storage,
        bucketId: config.avatarsBucketId,
        fileId: currentAvatarFileId,
      }).catch(() => {});
    }
  }

  await safeActivityLog({
    db,
    config,
    logger: log,
    data: {
      actorUserId,
      actorRole,
      action: "staff.update_permissions",
      entityType: "users",
      entityId: targetUserId,
      beforeData: safeJsonString(before),
      afterData: safeJsonString({
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        scopesJson: updated.scopesJson || "[]",
        enabled: updated.enabled !== false,
        avatarFileId: nextAvatarFileId,
      }),
      changedFields: [
        ...(hasFirstNamePatch ? ["firstName"] : []),
        ...(hasLastNamePatch ? ["lastName"] : []),
        ...(hasEmailPatch ? ["email"] : []),
        "role",
        "scopesJson",
        ...(hasAvatarPatch ? ["avatarFileId"] : []),
      ],
      severity: "info",
    },
  });

  return {
    status: 200,
    body: {
      ok: true,
      success: true,
      code: "STAFF_UPDATED",
      message: "Staff user updated",
      data: {
        userId: updated.$id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        scopesJson: updated.scopesJson || "[]",
        enabled: updated.enabled !== false,
        avatarFileId: nextAvatarFileId,
      },
    },
  };
};

const setStaffEnabled = async ({
  body,
  actorUserId,
  actorRole,
  db,
  config,
  log,
}) => {
  const targetUserId = normalize(body.targetUserId || body.userId, 64);
  if (!targetUserId) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "targetUserId is required",
      },
    };
  }

  if (targetUserId === actorUserId) {
    return {
      status: 422,
      body: {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "You cannot change your own enabled state",
      },
    };
  }

  const enabled = normalizeBool(body.enabled);
  const target = await getStaffProfile({ db, config, targetUserId });
  const before = {
    enabled: target.enabled !== false,
  };

  const updated = await db.updateDocument(
    config.databaseId,
    config.usersCollectionId,
    targetUserId,
    {
      enabled,
    },
  );

  await safeActivityLog({
    db,
    config,
    logger: log,
    data: {
      actorUserId,
      actorRole,
      action: enabled ? "staff.enable" : "staff.disable",
      entityType: "users",
      entityId: targetUserId,
      beforeData: safeJsonString(before),
      afterData: safeJsonString({ enabled: updated.enabled !== false }),
      changedFields: ["enabled"],
      severity: enabled ? "info" : "warning",
    },
  });

  return {
    status: 200,
    body: {
      ok: true,
      success: true,
      code: "STAFF_STATUS_UPDATED",
      message: "Staff enabled state updated",
      data: {
        userId: updated.$id,
        enabled: updated.enabled !== false,
      },
    },
  };
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
  const storage = new Storage(client);

  try {
    const actorProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );

    const actorRole = normalize(actorProfile.role, 40).toLowerCase();
    const actorScopes = parseScopesJson(actorProfile.scopesJson);
    const actorEnabled = actorProfile.enabled !== false;
    const isAllowedActor =
      actorEnabled &&
      (actorRole === "owner" || actorRole === "root" || hasScope(actorScopes, "staff.manage"));

    if (!isAllowedActor) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Only owner, root, or staff with staff.manage can manage team users",
      });
    }

    if (action === "create_staff") {
      const result = await createStaff({
        body,
        actorUserId,
        actorRole,
        users,
        storage,
        db,
        config,
        log,
      });
      return json(res, result.status, result.body);
    }

    if (action === "list_staff") {
      const staff = await listStaff({ db, users, config });
      return json(res, 200, {
        ok: true,
        success: true,
        code: "STAFF_LIST",
        data: {
          documents: staff,
          total: staff.length,
        },
      });
    }

    if (action === "update_staff") {
      const result = await updateStaff({
        body,
        actorUserId,
        actorRole,
        users,
        storage,
        db,
        config,
        log,
      });
      return json(res, result.status, result.body);
    }

    if (action === "set_staff_enabled") {
      const result = await setStaffEnabled({
        body,
        actorUserId,
        actorRole,
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
    const responseCode = Number(err?.code);
    const normalizedCode =
      responseCode === 403 || responseCode === 422 || responseCode === 404
        ? responseCode
        : 500;

    if (normalizedCode === 500) {
      error(`staff-user-management requestId=${requestId} failed: ${err.message}`);
      log(err.stack || "");
    }

    return json(res, normalizedCode, {
      ok: false,
      success: false,
      code: normalizedCode === 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR",
      message: err.message,
    });
  }
};
