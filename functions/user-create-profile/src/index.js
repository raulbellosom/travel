import { Client, Databases, Functions, ID, Permission, Role } from "node-appwrite";

const cfg = () => ({
  endpoint: process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  preferencesCollectionId:
    process.env.APPWRITE_COLLECTION_USER_PREFERENCES_ID || "user_preferences",
  emailVerificationFunctionId: process.env.APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID || "",
  defaultUserRole: process.env.APPWRITE_DEFAULT_AUTH_ROLE || "client",
  ownerBootstrapUserIds: process.env.APPWRITE_OWNER_AUTH_IDS || "",
  ownerBootstrapEmails: process.env.APPWRITE_OWNER_EMAILS || "",
});

const parsePayload = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const splitName = (name) => {
  const normalized = String(name || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { firstName: "Usuario", lastName: "" };
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const ALLOWED_DEFAULT_ROLES = new Set(["client", "owner"]);

const getErrorText = (error) => String(error?.message || "").toLowerCase();

const isAuthIdRequiredError = (error) => {
  const message = getErrorText(error);
  return message.includes("authid") && (message.includes("required") || message.includes("missing"));
};

const resolveInitialRole = ({ userId, email, config }) => {
  const normalizedEmail = normalizeEmail(email);
  const ownerUserIds = new Set(parseCsv(config.ownerBootstrapUserIds));
  const ownerEmails = new Set(parseCsv(config.ownerBootstrapEmails).map(normalizeEmail));

  if (ownerUserIds.has(String(userId || ""))) {
    return "owner";
  }

  if (normalizedEmail && ownerEmails.has(normalizedEmail)) {
    return "owner";
  }

  const defaultRole = String(config.defaultUserRole || "client").trim().toLowerCase();
  return ALLOWED_DEFAULT_ROLES.has(defaultRole) ? defaultRole : "client";
};

const buildProfilePermissions = ({ userId, config }) => {
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  const ownerReaderIds = parseCsv(config.ownerBootstrapUserIds);
  for (const ownerId of ownerReaderIds) {
    if (ownerId && ownerId !== userId) {
      permissions.push(Permission.read(Role.user(ownerId)));
    }
  }

  return permissions;
};

const createUsersProfileCompat = async ({ db, config, userId, profileData, permissions }) => {
  try {
    return await db.createDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      profileData,
      permissions
    );
  } catch (error) {
    if (!isAuthIdRequiredError(error)) throw error;

    return db.createDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      {
        ...profileData,
        authId: userId,
      },
      permissions
    );
  }
};

const updateUsersProfileCompat = async ({ db, config, userId, patch, permissions }) => {
  try {
    return await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      patch,
      permissions
    );
  } catch (error) {
    if (!isAuthIdRequiredError(error)) throw error;

    return db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      {
        ...patch,
        authId: userId,
      },
      permissions
    );
  }
};

const safeCreateUsersProfile = async (db, config, payload, log) => {
  const userId = payload.$id || payload.userId || payload.id;
  const email = normalizeEmail(payload.email || "");
  const phone = payload.phone || "";
  const { firstName, lastName } = splitName(payload.name || payload.fullName || "");
  const role = resolveInitialRole({ userId, email, config });

  const permissions = buildProfilePermissions({ userId, config });

  const profileData = {
    email,
    firstName,
    lastName,
    phone,
    role,
    scopesJson: "[]",
    isHidden: false,
    enabled: true,
  };

  try {
    await createUsersProfileCompat({
      db,
      config,
      userId,
      profileData,
      permissions,
    });
    return role === "owner" ? "created_owner" : "created_client";
  } catch (error) {
    const alreadyExists =
      Number(error?.code) === 409 ||
      String(error?.message || "").toLowerCase().includes("already exists");
    if (!alreadyExists) throw error;

    log(`users/${userId} ya existe, se actualiza estado basico.`);
    await updateUsersProfileCompat({
      db,
      config,
      userId,
      patch: {
        email,
        firstName,
        lastName,
        phone,
      },
      permissions,
    });
    return "updated";
  }
};

const safeCreatePreferences = async (db, config, userId) => {
  try {
    await db.createDocument(
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
      [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))]
    );
  } catch (error) {
    const alreadyExists = Number(error?.code) === 409;
    if (!alreadyExists) throw error;
  }
};

const triggerEmailVerification = async (fn, functionId, userId, email, log, error) => {
  if (!functionId) {
    log("APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID no configurado. Se omite envío.");
    return;
  }

  try {
    await fn.createExecution(functionId, JSON.stringify({
      action: "send",
      userId,
      email,
    }), true);
  } catch (err) {
    error(`No se pudo disparar email-verification: ${err.message}`);
  }
};

export default async ({ req, res, log, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, message: "Missing Appwrite credentials" }, 500);
  }

  const payload = parsePayload(req);
  const userId = payload.$id || payload.userId || payload.id;
  if (!userId) {
    return res.json({ ok: false, message: "Missing user id in payload" }, 400);
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const db = new Databases(client);
  const fn = new Functions(client);

  try {
    const action = await safeCreateUsersProfile(db, config, payload, log);
    await safeCreatePreferences(db, config, userId);
    await triggerEmailVerification(
      fn,
      config.emailVerificationFunctionId,
      userId,
      payload.email,
      log,
      error
    );

    return res.json({ ok: true, action, userId });
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, message: err.message }, 500);
  }
};
