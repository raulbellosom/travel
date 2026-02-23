import { Client, Databases } from "node-appwrite";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getEnv = (...keys) => {
  for (const key of keys) {
    if (hasValue(process.env[key])) return process.env[key];
  }
  return "";
};

const cfg = () => ({
  endpoint: getEnv("APPWRITE_FUNCTION_ENDPOINT", "APPWRITE_ENDPOINT"),
  projectId: getEnv("APPWRITE_FUNCTION_PROJECT_ID", "APPWRITE_PROJECT_ID"),
  apiKey: getEnv("APPWRITE_FUNCTION_API_KEY", "APPWRITE_API_KEY"),
  databaseId: getEnv("APPWRITE_DATABASE_ID") || "main",
  usersCollectionId: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
  appBaseUrl: getEnv("APP_BASE_URL") || "http://localhost:5173",
  stripeSecretKey: getEnv("STRIPE_SECRET_KEY") || "",
});

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim();
  return maxLength ? normalized.slice(0, maxLength) : normalized;
};

const getAuthenticatedUserId = (req) => {
  const headers = req.headers || {};
  return normalizeText(
    headers["x-appwrite-user-id"] || headers["x-appwrite-userid"],
    64,
  );
};

const json = (res, status, body) => res.json(body, status);

const canManageOwnStripe = (userDoc = {}) => {
  const role = normalizeText(userDoc.role, 40).toLowerCase();
  if (role === "owner" || role === "root") return true;
  return userDoc.stripePayoutsEnabled === true;
};

const createAccountLink = async ({ stripeSecretKey, stripeAccountId, refreshUrl, returnUrl }) => {
  if (!stripeSecretKey) {
    return {
      url: `${returnUrl}?stripe_mock=1&account=${encodeURIComponent(stripeAccountId)}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
  }

  const payload = new URLSearchParams({
    account: stripeAccountId,
    type: "account_onboarding",
    refresh_url: refreshUrl,
    return_url: returnUrl,
  });

  const response = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok || !data.url) {
    throw new Error(
      `Stripe account link creation failed (${response.status}): ${String(
        data?.error?.message || text,
      ).slice(0, 300)}`,
    );
  }

  return data;
};

export default async ({ req, res, error }) => {
  if (req.method && req.method.toUpperCase() !== "POST") {
    return json(res, 405, {
      ok: false,
      success: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST",
    });
  }

  const config = cfg();
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
      code: "AUTH_REQUIRED",
      message: "You must be authenticated",
    });
  }

  const body = parseBody(req);

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const actor = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      actorUserId,
    );
    const actorRole = normalizeText(actor.role, 40).toLowerCase();
    const actorCanManageOwnStripe = canManageOwnStripe(actor);
    if (!actorCanManageOwnStripe) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message:
          "Your user is not enabled for Stripe payouts. Ask an owner to enable stripePayoutsEnabled.",
      });
    }

    const targetUserId = normalizeText(body.userId, 64) || actorUserId;
    if (targetUserId !== actorUserId && actorRole !== "root") {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "FORBIDDEN",
        message: "Only root can request links for another owner",
      });
    }

    const targetUser = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      targetUserId,
    );
    if (!canManageOwnStripe(targetUser)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "ROLE_NOT_ALLOWED",
        message:
          "Target user is not enabled for Stripe payouts (owner/root or stripePayoutsEnabled=true required).",
      });
    }

    const stripeAccountId = normalizeText(targetUser.stripeAccountId, 120);
    if (!stripeAccountId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "STRIPE_ACCOUNT_MISSING",
        message: "Connected account is missing. Create it first.",
      });
    }

    const baseUrl = String(config.appBaseUrl).replace(/\/$/, "");
    const refreshUrl = `${baseUrl}/app/payments/connect/refresh`;
    const returnUrl = `${baseUrl}/app/payments/connect/complete`;

    const link = await createAccountLink({
      stripeSecretKey: config.stripeSecretKey,
      stripeAccountId,
      refreshUrl,
      returnUrl,
    });

    await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      targetUserId,
      {
        stripeOnboardingUrl: String(link.url).slice(0, 1000),
        stripeOnboardingStatus:
          normalizeText(targetUser.stripeOnboardingStatus, 40) || "pending",
      },
    );

    return json(res, 200, {
      ok: true,
      success: true,
      code: "STRIPE_ACCOUNT_LINK_CREATED",
      data: {
        userId: targetUserId,
        stripeAccountId,
        onboardingUrl: String(link.url).slice(0, 1000),
        expiresAt: link.expires_at || null,
      },
    });
  } catch (err) {
    error(`stripe-create-account-link failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
