import { Client, Databases, Functions, Users } from "node-appwrite";
import {
  getAuthenticatedUserId,
  getRequestId,
  isMethodAllowed,
  json,
  parseBody,
} from "./_request.js";

const getConfig = () => ({
  endpoint:
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  emailVerificationFunctionId:
    process.env.APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID || "",
});

const normalize = (value, max = 0) => {
  const str = String(value ?? "").trim();
  return max > 0 ? str.slice(0, max) : str;
};

const normalizeDigits = (value, max = 0) => {
  const str = String(value ?? "").replace(/\D/g, "");
  return max > 0 ? str.slice(0, max) : str;
};

const normalizeDialCode = (value) => {
  const digits = normalizeDigits(value, 4);
  return digits ? `+${digits}` : "";
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LOCAL_REGEX = /^[0-9]{6,15}$/;
const DIAL_CODE_REGEX = /^\+[1-9][0-9]{0,3}$/;
const E164_REGEX = /^\+[1-9][0-9]{6,14}$/;
const ALLOWED_FIELDS = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "phoneCountryCode",
  "whatsappNumber",
  "whatsappCountryCode",
]);
const OPTIONAL_COMPAT_FIELDS = [
  "phoneCountryCode",
  "whatsappCountryCode",
  "whatsappNumber",
];

const isValidEmail = (value) => EMAIL_REGEX.test(String(value || ""));
const isValidPhoneLocal = (value) => PHONE_LOCAL_REGEX.test(String(value || ""));
const isValidDialCode = (value) => DIAL_CODE_REGEX.test(String(value || ""));

const buildE164Phone = ({ dialCode, localNumber }) => {
  if (!hasValue(localNumber)) return "";
  if (!isValidDialCode(dialCode) || !isValidPhoneLocal(localNumber)) return "";
  const value = `${dialCode}${localNumber}`;
  return E164_REGEX.test(value) ? value : "";
};

const isUnknownAttributeError = (err, fieldName) => {
  const message = String(err?.message || "").toLowerCase();
  const target = String(fieldName || "").toLowerCase();
  return message.includes(target) && message.includes("attribute");
};

const fullName = (firstName, lastName) =>
  `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

const getUnknownFields = (body) =>
  Object.keys(body || {}).filter((key) => !ALLOWED_FIELDS.has(key));

const updateProfileCompat = async ({
  db,
  databaseId,
  usersCollectionId,
  userId,
  patch,
}) => {
  let nextPatch = { ...(patch || {}) };
  let lastError = null;

  for (let attempt = 0; attempt <= OPTIONAL_COMPAT_FIELDS.length; attempt += 1) {
    try {
      await db.updateDocument(
        databaseId,
        usersCollectionId,
        userId,
        nextPatch,
      );
      return Object.keys(nextPatch);
    } catch (dbErr) {
      lastError = dbErr;
      const unknownField = OPTIONAL_COMPAT_FIELDS.find(
        (fieldName) =>
          Object.prototype.hasOwnProperty.call(nextPatch, fieldName) &&
          isUnknownAttributeError(dbErr, fieldName),
      );
      if (!unknownField) {
        throw dbErr;
      }
      delete nextPatch[unknownField];
    }
  }

  throw lastError || new Error("Unable to update profile");
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

  const body = parseBody(req);
  const unknownFields = getUnknownFields(body);
  if (unknownFields.length > 0) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: `Unsupported fields: ${unknownFields.join(", ")}`,
    });
  }

  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "UNAUTHORIZED",
      message: "Missing authenticated user context",
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const users = new Users(client);
  const db = new Databases(client);
  const fn = new Functions(client);

  try {
    const requestId = getRequestId(req);
    const authUser = await users.get(userId);
    const currentProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
    );

    const nextFirstName = normalize(
      body.firstName ?? currentProfile.firstName,
      80,
    );
    const nextLastName = normalize(
      body.lastName ?? currentProfile.lastName,
      80,
    );
    const nextEmail = normalize(
      body.email ?? authUser.email,
      254,
    ).toLowerCase();
    const nextPhone = normalizeDigits(body.phone ?? currentProfile.phone, 15);
    const nextPhoneCountryCode = normalizeDialCode(
      body.phoneCountryCode ?? currentProfile.phoneCountryCode,
    );
    const nextWhatsappNumber = normalizeDigits(
      body.whatsappNumber ?? currentProfile.whatsappNumber,
      15,
    );
    const nextWhatsappCountryCode = normalizeDialCode(
      body.whatsappCountryCode ?? currentProfile.whatsappCountryCode,
    );

    if (!nextFirstName || !nextLastName) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "firstName and lastName cannot be empty",
      });
    }

    if (!nextEmail || !isValidEmail(nextEmail)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid email format",
      });
    }

    if (hasValue(nextPhone) && !isValidPhoneLocal(nextPhone)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid phone format",
      });
    }

    if (hasValue(nextPhone) && !hasValue(nextPhoneCountryCode)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "phoneCountryCode is required when phone is present",
      });
    }

    if (hasValue(nextPhoneCountryCode) && !isValidDialCode(nextPhoneCountryCode)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid phoneCountryCode format",
      });
    }

    const nextPhoneE164 = buildE164Phone({
      dialCode: nextPhoneCountryCode,
      localNumber: nextPhone,
    });

    if (hasValue(nextPhone) && !nextPhoneE164) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid phone format",
      });
    }

    if (hasValue(nextWhatsappNumber) && !isValidPhoneLocal(nextWhatsappNumber)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid whatsappNumber format",
      });
    }

    if (hasValue(nextWhatsappNumber) && !hasValue(nextWhatsappCountryCode)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "whatsappCountryCode is required when whatsappNumber is present",
      });
    }

    if (
      hasValue(nextWhatsappCountryCode) &&
      !isValidDialCode(nextWhatsappCountryCode)
    ) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid whatsappCountryCode format",
      });
    }

    const nextWhatsappE164 = buildE164Phone({
      dialCode: nextWhatsappCountryCode,
      localNumber: nextWhatsappNumber,
    });

    if (hasValue(nextWhatsappNumber) && !nextWhatsappE164) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid whatsappNumber format",
      });
    }

    const patch = {
      firstName: nextFirstName,
      lastName: nextLastName,
      phone: nextPhone,
      phoneCountryCode: hasValue(nextPhone) ? nextPhoneCountryCode : "",
      whatsappNumber: nextWhatsappNumber,
      whatsappCountryCode: hasValue(nextWhatsappNumber)
        ? nextWhatsappCountryCode
        : "",
    };

    const emailChanged =
      nextEmail && nextEmail !== String(authUser.email || "").toLowerCase();
    if (emailChanged) {
      patch.email = nextEmail;
    }

    const updatedFields = await updateProfileCompat({
      db,
      databaseId: config.databaseId,
      usersCollectionId: config.usersCollectionId,
      userId,
      patch,
    });

    const authUpdates = [];
    const nextName = fullName(nextFirstName, nextLastName);
    if (nextName && nextName !== authUser.name) {
      await users.updateName(userId, nextName);
      authUpdates.push("name");
    }

    if (emailChanged) {
      await users.updateEmail(userId, nextEmail);
      await users.updateEmailVerification(userId, false);
      authUpdates.push("email");
    }

    if (hasValue(nextPhoneE164) && nextPhoneE164 !== authUser.phone) {
      await users.updatePhone(userId, nextPhoneE164);
      authUpdates.push("phone");
    }

    if (emailChanged && config.emailVerificationFunctionId) {
      try {
        await fn.createExecution(
          config.emailVerificationFunctionId,
          JSON.stringify({
            action: "send",
            userId,
            email: nextEmail,
          }),
          true,
        );
      } catch (fnErr) {
        error(
          `sync-user-profile requestId=${requestId} email verification failed: ${fnErr.message}`,
        );
      }
    }

    return json(res, 200, {
      ok: true,
      success: true,
      code: "PROFILE_SYNCED",
      userId,
      updated: updatedFields,
      syncedAuth: authUpdates,
    });
  } catch (err) {
    const requestId = getRequestId(req);
    error(`sync-user-profile requestId=${requestId} failed: ${err.message}`);
    log(err.stack || "");
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
