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

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
const ALLOWED_FIELDS = new Set(["firstName", "lastName", "email", "phone"]);

const isValidEmail = (value) => EMAIL_REGEX.test(String(value || ""));
const isValidPhone = (value) => PHONE_REGEX.test(String(value || ""));

const fullName = (firstName, lastName) =>
  `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

const getUnknownFields = (body) =>
  Object.keys(body || {}).filter((key) => !ALLOWED_FIELDS.has(key));

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
    const nextPhone = normalize(body.phone ?? currentProfile.phone, 20);

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

    if (hasValue(nextPhone) && !isValidPhone(nextPhone)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid phone format",
      });
    }

    const patch = {
      firstName: nextFirstName,
      lastName: nextLastName,
      phone: nextPhone,
    };

    const emailChanged =
      nextEmail && nextEmail !== String(authUser.email || "").toLowerCase();
    if (emailChanged) {
      patch.email = nextEmail;
    }

    await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      patch,
    );

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

    if (hasValue(nextPhone) && nextPhone !== authUser.phone) {
      await users.updatePhone(userId, nextPhone);
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
      updated: Object.keys(patch),
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
