import { Client, Databases, ID, Query, Users } from "node-appwrite";
import {
  buildPasswordResetEmailHtml,
  json,
  safeBodyJson,
  sendEmail,
} from "./_shared.js";

/* ─── Config ─────────────────────────────────────────────────────────── */
const getConfig = () => ({
  endpoint:
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "mainv2",
  collectionId:
    process.env.APPWRITE_COLLECTION_PASSWORD_RESETS_ID || "password_resets",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  appName: process.env.APP_NAME || "Inmobo",
  tokenTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60),
  resendCooldownSeconds: Number(
    process.env.PASSWORD_RESET_COOLDOWN_SECONDS || 60,
  ),
});

const getClient = (cfg) =>
  new Client()
    .setEndpoint(cfg.endpoint)
    .setProject(cfg.projectId)
    .setKey(cfg.apiKey);

/* ─── Helpers ────────────────────────────────────────────────────────── */
const getAction = (req, body) => {
  const url = req.url || "";
  const queryAction = new URL(url, "http://localhost").searchParams.get(
    "action",
  );
  return body.action || queryAction || "send";
};

/**
 * Resolve a Appwrite auth user from { email } or { userId } in the body.
 */
const resolveUser = async (users, body) => {
  if (body.userId) return users.get(body.userId);
  if (!body.email) return null;
  const result = await users.list([
    Query.equal("email", String(body.email).trim().toLowerCase()),
    Query.limit(1),
  ]);
  return result.users?.[0] || null;
};

/**
 * Check if there is an active (not-expired, not-used) reset token issued
 * within the cooldown window so we don't spam the user.
 */
const checkCooldown = async (db, cfg, userId) => {
  if (cfg.resendCooldownSeconds <= 0) return null;
  const result = await db.listDocuments(cfg.databaseId, cfg.collectionId, [
    Query.equal("userId", userId),
    Query.equal("used", false),
    Query.equal("invalidated", false),
    Query.orderDesc("$createdAt"),
    Query.limit(1),
  ]);
  const doc = result.documents?.[0];
  if (!doc) return null;

  const createdAt = new Date(doc.$createdAt).getTime();
  if (Number.isNaN(createdAt)) return null;
  const nextAllowedAt = createdAt + cfg.resendCooldownSeconds * 1000;
  if (nextAllowedAt <= Date.now()) return null;

  return {
    retryAfterSeconds: Math.ceil((nextAllowedAt - Date.now()) / 1000),
    nextAllowedAt: new Date(nextAllowedAt).toISOString(),
  };
};

/** Invalidate all previously active tokens for a user before issuing a new one. */
const invalidateTokens = async (db, cfg, userId) => {
  const result = await db.listDocuments(cfg.databaseId, cfg.collectionId, [
    Query.equal("userId", userId),
    Query.equal("used", false),
    Query.equal("invalidated", false),
    Query.limit(50),
  ]);
  await Promise.all(
    result.documents.map((doc) =>
      db.updateDocument(cfg.databaseId, cfg.collectionId, doc.$id, {
        invalidated: true,
      }),
    ),
  );
};

/* ─── Actions ────────────────────────────────────────────────────────── */

/**
 * `send` action
 * Body: { email } | { userId }
 * Creates a reset token, stores it in the DB, sends SMTP email.
 * Always responds 200 to prevent user enumeration.
 */
const sendReset = async ({ db, users, cfg, body, log }) => {
  const authUser = await resolveUser(users, body).catch(() => null);

  // Silent 200 when user not found — prevents email enumeration
  if (!authUser || !authUser.email) {
    log("send-password-reset: user not found, returning silent 200");
    return {
      status: 200,
      body: { ok: true, message: "Si el correo existe recibirás un enlace." },
    };
  }

  // Cooldown guard
  const cooldown = await checkCooldown(db, cfg, authUser.$id);
  if (cooldown) {
    return {
      status: 429,
      body: {
        ok: false,
        code: "COOLDOWN",
        message: `Espera ${cooldown.retryAfterSeconds} segundos antes de solicitar otro enlace.`,
        retryAfterSeconds: cooldown.retryAfterSeconds,
        nextAllowedAt: cooldown.nextAllowedAt,
      },
    };
  }

  await invalidateTokens(db, cfg, authUser.$id);

  const token = ID.unique();
  const expireAt = new Date(
    Date.now() + cfg.tokenTtlMinutes * 60 * 1000,
  ).toISOString();

  await db.createDocument(cfg.databaseId, cfg.collectionId, ID.unique(), {
    userId: authUser.$id,
    email: authUser.email,
    token,
    expireAt,
    used: false,
    invalidated: false,
  });

  const base = cfg.appBaseUrl.replace(/\/$/, "");
  const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail(
    authUser.email,
    "Restablece tu contraseña • " + cfg.appName,
    buildPasswordResetEmailHtml({ link, appName: cfg.appName }),
  );

  log(
    `send-password-reset: token sent to ${authUser.email} (userId=${authUser.$id})`,
  );

  return {
    status: 200,
    body: { ok: true, message: "Si el correo existe recibirás un enlace." },
  };
};

/**
 * `reset` action
 * Body: { token, password }
 * Validates the token and updates the user password via the server-side API.
 */
const resetPasswordWithToken = async ({ db, users, cfg, body, log }) => {
  const token = String(body.token || "").trim();
  const password = String(body.password || "");

  if (!token) {
    return {
      status: 400,
      body: { ok: false, code: "MISSING_TOKEN", message: "Token requerido." },
    };
  }

  if (!password || password.length < 8) {
    return {
      status: 400,
      body: {
        ok: false,
        code: "INVALID_PASSWORD",
        message: "La contraseña debe tener al menos 8 caracteres.",
      },
    };
  }

  // Look up the token
  const result = await db.listDocuments(cfg.databaseId, cfg.collectionId, [
    Query.equal("token", token),
    Query.equal("used", false),
    Query.equal("invalidated", false),
    Query.limit(1),
  ]);

  if (!result.total) {
    return {
      status: 400,
      body: {
        ok: false,
        code: "INVALID_TOKEN",
        message: "El enlace no es válido o ya fue utilizado.",
      },
    };
  }

  const doc = result.documents[0];

  if (new Date(doc.expireAt).getTime() < Date.now()) {
    // Mark expired token
    await db.updateDocument(cfg.databaseId, cfg.collectionId, doc.$id, {
      invalidated: true,
    });
    return {
      status: 400,
      body: {
        ok: false,
        code: "TOKEN_EXPIRED",
        message: "El enlace ha expirado. Solicita uno nuevo.",
      },
    };
  }

  // Update the password via the server-side Users API (bypasses Appwrite email)
  await users.updatePassword(doc.userId, password);

  // Mark token as used
  await db.updateDocument(cfg.databaseId, cfg.collectionId, doc.$id, {
    used: true,
  });

  log(`send-password-reset: password updated for userId=${doc.userId}`);

  return {
    status: 200,
    body: {
      ok: true,
      code: "PASSWORD_RESET",
      message: "Contraseña actualizada correctamente.",
    },
  };
};

/* ─── Entry point ────────────────────────────────────────────────────── */
export default async ({ req, res, log, error }) => {
  const cfg = getConfig();

  if (!cfg.endpoint || !cfg.projectId || !cfg.apiKey) {
    return json(res, 500, {
      ok: false,
      code: "MISSING_CONFIG",
      message: "Missing Appwrite credentials.",
    });
  }

  const body = safeBodyJson(req);
  const action = getAction(req, body);
  const client = getClient(cfg);
  const db = new Databases(client);
  const users = new Users(client);

  try {
    if (action === "send") {
      const result = await sendReset({ db, users, cfg, body, log });
      return json(res, result.status, result.body);
    }

    if (action === "reset") {
      const result = await resetPasswordWithToken({
        db,
        users,
        cfg,
        body,
        log,
      });
      return json(res, result.status, result.body);
    }

    return json(res, 400, {
      ok: false,
      code: "INVALID_ACTION",
      message: "Acción inválida. Usa: send | reset",
    });
  } catch (err) {
    error(`send-password-reset [${action}] failed: ${err.message}`);
    log(err.stack || "");
    return json(res, 500, {
      ok: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
