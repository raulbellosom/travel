import {
  Client,
  Databases,
  Functions,
  ID,
  Permission,
  Role,
} from "node-appwrite";

const cfg = () => ({
  endpoint:
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  preferencesCollectionId:
    process.env.APPWRITE_COLLECTION_USER_PREFERENCES_ID || "user_preferences",
  emailVerificationFunctionId:
    process.env.APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID || "",
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
  const normalized = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized) return { firstName: "Usuario", lastName: "" };
  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
};

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizePhoneLocal = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 15);
const normalizeDialCode = (value) => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  return digits ? `+${digits}` : "";
};

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getErrorText = (error) => String(error?.message || "").toLowerCase();

const isAuthIdRequiredError = (error) => {
  const message = getErrorText(error);
  return (
    message.includes("authid") &&
    (message.includes("required") || message.includes("missing"))
  );
};

const isUnknownAttributeError = (error, fieldName) => {
  const message = getErrorText(error);
  const field = String(fieldName || "").toLowerCase();
  return message.includes(field) && message.includes("attribute");
};

const DIAL_CODE_REGEX = /^\+[1-9][0-9]{0,3}$/;
const PHONE_LOCAL_REGEX = /^[0-9]{6,15}$/;

const isValidDialCode = (value) => DIAL_CODE_REGEX.test(String(value || ""));
const isValidPhoneLocal = (value) =>
  PHONE_LOCAL_REGEX.test(String(value || ""));

const splitE164Phone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return { phone: "", phoneCountryCode: "" };

  for (let length = 4; length >= 1; length -= 1) {
    const dial = `+${digits.slice(0, length)}`;
    const local = digits.slice(length);
    if (isValidDialCode(dial) && isValidPhoneLocal(local)) {
      return {
        phone: local,
        phoneCountryCode: dial,
      };
    }
  }

  return { phone: "", phoneCountryCode: "" };
};

const resolvePhoneFields = (payload) => {
  const rawPhone = String(payload.phone || "").trim();
  if (rawPhone.startsWith("+")) {
    const parsed = splitE164Phone(rawPhone);
    if (parsed.phone) return parsed;
  }

  const phone = normalizePhoneLocal(payload.phone);
  const phoneCountryCode = normalizeDialCode(payload.phoneCountryCode);
  if (!phone) return { phone: "", phoneCountryCode: "" };

  return {
    phone,
    phoneCountryCode: isValidDialCode(phoneCountryCode) ? phoneCountryCode : "",
  };
};

const resolveInitialRole = () => {
  // All new users start as 'client' by default
  // Role upgrades (owner, staff, etc.) are managed through the database by root users
  return "client";
};

const buildProfilePermissions = ({ userId }) => {
  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  return permissions;
};

const createUsersProfileCompat = async ({
  db,
  config,
  userId,
  profileData,
  permissions,
}) => {
  try {
    return await db.createDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      profileData,
      permissions,
    );
  } catch (error) {
    let nextProfileData = { ...profileData };
    if (isUnknownAttributeError(error, "phoneCountryCode")) {
      delete nextProfileData.phoneCountryCode;
    }

    if (!isAuthIdRequiredError(error)) {
      if (!isUnknownAttributeError(error, "phoneCountryCode")) {
        throw error;
      }

      return db.createDocument(
        config.databaseId,
        config.usersCollectionId,
        userId,
        nextProfileData,
        permissions,
      );
    }

    return db.createDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      {
        ...nextProfileData,
        authId: userId,
      },
      permissions,
    );
  }
};

const updateUsersProfileCompat = async ({
  db,
  config,
  userId,
  patch,
  permissions,
}) => {
  try {
    return await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      patch,
      permissions,
    );
  } catch (error) {
    let nextPatch = { ...patch };
    if (isUnknownAttributeError(error, "phoneCountryCode")) {
      delete nextPatch.phoneCountryCode;
    }

    if (!isAuthIdRequiredError(error)) {
      if (!isUnknownAttributeError(error, "phoneCountryCode")) {
        throw error;
      }

      return db.updateDocument(
        config.databaseId,
        config.usersCollectionId,
        userId,
        nextPatch,
        permissions,
      );
    }

    return db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      {
        ...nextPatch,
        authId: userId,
      },
      permissions,
    );
  }
};

const safeCreateUsersProfile = async (db, config, payload, log) => {
  const userId = payload.$id || payload.userId || payload.id;
  const email = normalizeEmail(payload.email || "");
  const { phone, phoneCountryCode } = resolvePhoneFields(payload);
  const { firstName, lastName } = splitName(
    payload.name || payload.fullName || "",
  );
  const role = resolveInitialRole();

  const permissions = buildProfilePermissions({ userId });

  const profileData = {
    email,
    firstName,
    lastName,
    phone,
    phoneCountryCode,
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
      String(error?.message || "")
        .toLowerCase()
        .includes("already exists");
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
        phoneCountryCode,
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
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
      ],
    );
  } catch (error) {
    const alreadyExists = Number(error?.code) === 409;
    if (!alreadyExists) throw error;
  }
};

const triggerEmailVerification = async (
  fn,
  functionId,
  userId,
  email,
  log,
  error,
) => {
  if (!functionId) {
    log(
      "APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID no configurado. Se omite envío.",
    );
    return;
  }

  try {
    await fn.createExecution(
      functionId,
      JSON.stringify({
        action: "send",
        userId,
        email,
      }),
      true,
    );
  } catch (err) {
    error(`No se pudo disparar email-verification: ${err.message}`);
  }
};

export default async ({ req, res, log, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json(
      { ok: false, message: "Missing Appwrite credentials" },
      500,
    );
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
      error,
    );

    return res.json({ ok: true, action, userId });
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, message: err.message }, 500);
  }
};
