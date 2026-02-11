import { Client, Databases, ID, Query, Users } from "node-appwrite";
import { buildEmailHtml, json, safeBodyJson, sendEmail } from "./_shared.js";

const config = () => ({
  endpoint: process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  verificationsCollectionId:
    process.env.APPWRITE_COLLECTION_EMAIL_VERIFICATIONS_ID || "email_verifications",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  tokenTtlMinutes: Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES || 120),
  resendCooldownSeconds: Number(
    process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS || 180
  ),
});

const getClient = (cfg) =>
  new Client().setEndpoint(cfg.endpoint).setProject(cfg.projectId).setKey(cfg.apiKey);

const getAction = (req, body) => {
  const url = req.url || "";
  const queryAction = new URL(url, "http://localhost").searchParams.get("action");
  return body.action || queryAction || "send";
};

const listLatestVerification = async (db, cfg, userAuthId) => {
  const result = await db.listDocuments(cfg.databaseId, cfg.verificationsCollectionId, [
    Query.equal("userAuthId", userAuthId),
    Query.orderDesc("$createdAt"),
    Query.limit(1),
  ]);

  return result.documents?.[0] || null;
};

const ensureCooldown = async (db, cfg, userAuthId) => {
  if (cfg.resendCooldownSeconds <= 0) return null;
  const latest = await listLatestVerification(db, cfg, userAuthId);
  if (!latest) return null;

  const createdAt = new Date(latest.$createdAt).getTime();
  if (Number.isNaN(createdAt)) return null;
  const nextAllowedAt = createdAt + cfg.resendCooldownSeconds * 1000;
  if (nextAllowedAt <= Date.now()) return null;

  const retryAfterSeconds = Math.ceil((nextAllowedAt - Date.now()) / 1000);
  return {
    retryAfterSeconds,
    nextAllowedAt: new Date(nextAllowedAt).toISOString(),
  };
};

const invalidateTokens = async (db, cfg, userAuthId) => {
  const result = await db.listDocuments(cfg.databaseId, cfg.verificationsCollectionId, [
    Query.equal("userAuthId", userAuthId),
    Query.equal("used", false),
    Query.equal("invalidated", false),
    Query.limit(100),
  ]);

  await Promise.all(
    result.documents.map((doc) =>
      db.updateDocument(cfg.databaseId, cfg.verificationsCollectionId, doc.$id, {
        invalidated: true,
      })
    )
  );
};

const resolveAuthUser = async (users, body) => {
  if (body.userId) return users.get(body.userId);
  if (body.userAuthId) return users.get(body.userAuthId);
  if (!body.email) return null;
  const result = await users.list([Query.equal("email", body.email), Query.limit(1)]);
  return result.users?.[0] || null;
};

const sendVerification = async ({ db, users, cfg, body }) => {
  const authUser = await resolveAuthUser(users, body);
  if (!authUser || !authUser.email) {
    return { status: 404, body: { ok: false, error: "User not found" } };
  }

  if (authUser.emailVerification) {
    return { status: 200, body: { ok: true, message: "Email already verified" } };
  }

  const cooldown = await ensureCooldown(db, cfg, authUser.$id);
  if (cooldown) {
    return {
      status: 429,
      body: {
        ok: false,
        error: "Resend cooldown active",
        message: `Debes esperar ${cooldown.retryAfterSeconds} segundos para reenviar.`,
        ...cooldown,
      },
    };
  }

  await invalidateTokens(db, cfg, authUser.$id);
  const token = ID.unique();
  const expireAt = new Date(Date.now() + cfg.tokenTtlMinutes * 60 * 1000).toISOString();

  await db.createDocument(cfg.databaseId, cfg.verificationsCollectionId, ID.unique(), {
    userAuthId: authUser.$id,
    email: authUser.email,
    token,
    expireAt,
    used: false,
    invalidated: false,
  });

  await sendEmail(
    authUser.email,
    "Verifica tu correo",
    buildEmailHtml(token, cfg.appBaseUrl)
  );

  return {
    status: 200,
    body: { ok: true, message: "Verification email sent" },
  };
};

const verifyToken = async ({ db, users, cfg, body, log }) => {
  if (!body.token) {
    return { status: 400, body: { ok: false, error: "Missing token" } };
  }

  const result = await db.listDocuments(cfg.databaseId, cfg.verificationsCollectionId, [
    Query.equal("token", body.token),
    Query.equal("used", false),
    Query.equal("invalidated", false),
    Query.limit(1),
  ]);

  if (!result.total) {
    return { status: 400, body: { ok: false, error: "Token inválido o ya usado" } };
  }

  const tokenDoc = result.documents[0];
  if (new Date(tokenDoc.expireAt).getTime() < Date.now()) {
    return { status: 400, body: { ok: false, error: "Token expirado" } };
  }

  await users.updateEmailVerification(tokenDoc.userAuthId, true);
  await db.updateDocument(cfg.databaseId, cfg.verificationsCollectionId, tokenDoc.$id, {
    used: true,
  });

  try {
    await db.updateDocument(
      cfg.databaseId,
      cfg.usersCollectionId,
      tokenDoc.userAuthId,
      {
        email: tokenDoc.email,
      }
    );
  } catch (err) {
    log(`No se pudo sincronizar users.emailVerified: ${err.message}`);
  }

  return { status: 200, body: { ok: true, message: "Email verificado" } };
};

export default async ({ req, res, log, error }) => {
  const cfg = config();
  if (!cfg.endpoint || !cfg.projectId || !cfg.apiKey) {
    return json(res, 500, { ok: false, error: "Missing Appwrite credentials" });
  }

  const body = safeBodyJson(req);
  const action = getAction(req, body);
  const client = getClient(cfg);
  const db = new Databases(client);
  const users = new Users(client);

  try {
    if (action === "send" || action === "resend") {
      const result = await sendVerification({ db, users, cfg, body });
      return json(res, result.status, result.body);
    }

    if (action === "verify") {
      const result = await verifyToken({ db, users, cfg, body, log });
      return json(res, result.status, result.body);
    }

    return json(res, 400, {
      ok: false,
      error: "Invalid action. Use send, resend or verify.",
    });
  } catch (err) {
    error(err.message);
    return json(res, 500, { ok: false, error: err.message });
  }
};
