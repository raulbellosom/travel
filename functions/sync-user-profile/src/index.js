import { Client, Databases, Functions, Users } from "node-appwrite";

const getConfig = () => ({
  endpoint: process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  emailVerificationFunctionId: process.env.APPWRITE_FUNCTION_EMAIL_VERIFICATION_ID || "",
});

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const normalize = (value, max = 0) => {
  const str = String(value ?? "").trim();
  return max > 0 ? str.slice(0, max) : str;
};

const fullName = (firstName, lastName) =>
  `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

const getUserId = (req, body) =>
  process.env.APPWRITE_FUNCTION_USER_ID ||
  req.headers?.["x-appwrite-user-id"] ||
  body.userId ||
  null;

export default async ({ req, res, log, error }) => {
  const config = getConfig();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, message: "Missing Appwrite credentials" }, 500);
  }

  const body = parseBody(req);
  const userId = getUserId(req, body);
  if (!userId) {
    return res.json({ ok: false, message: "Unauthorized" }, 401);
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const users = new Users(client);
  const db = new Databases(client);
  const fn = new Functions(client);

  try {
    const authUser = await users.get(userId);
    const currentProfile = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      userId
    );

    const nextFirstName = normalize(body.firstName ?? currentProfile.firstName, 80);
    const nextLastName = normalize(body.lastName ?? currentProfile.lastName, 80);
    const nextEmail = normalize(body.email ?? authUser.email, 254).toLowerCase();
    const nextPhone = normalize(body.phone ?? currentProfile.phone, 20);

    const patch = {
      firstName: nextFirstName,
      lastName: nextLastName,
      phone: nextPhone,
    };

    const emailChanged = nextEmail && nextEmail !== String(authUser.email || "").toLowerCase();
    if (emailChanged) {
      patch.email = nextEmail;
    }

    await db.updateDocument(config.databaseId, config.usersCollectionId, userId, patch);

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

    if (nextPhone && nextPhone !== authUser.phone) {
      await users.updatePhone(userId, nextPhone);
      authUpdates.push("phone");
    }

    if (emailChanged && config.emailVerificationFunctionId) {
      try {
        await fn.createExecution(
          config.emailVerificationFunctionId,
          JSON.stringify({
            action: "send",
            userAuthId: userId,
            email: nextEmail,
          }),
          true
        );
      } catch (fnErr) {
        error(`No se pudo enviar nueva verificación: ${fnErr.message}`);
      }
    }

    return res.json({
      ok: true,
      userId,
      updated: Object.keys(patch),
      syncedAuth: authUpdates,
    });
  } catch (err) {
    error(`sync-user-profile failed: ${err.message}`);
    log(err.stack || "");
    return res.json({ ok: false, message: err.message }, 500);
  }
};
