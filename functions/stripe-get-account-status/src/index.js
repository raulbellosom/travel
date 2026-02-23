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

const fetchStripeAccount = async ({ stripeSecretKey, stripeAccountId }) => {
  if (!stripeSecretKey) {
    return {
      id: stripeAccountId,
      charges_enabled: true,
      payouts_enabled: true,
      requirements: { currently_due: [] },
      capabilities: {
        card_payments: "active",
        transfers: "active",
      },
    };
  }

  const response = await fetch(
    `https://api.stripe.com/v1/accounts/${encodeURIComponent(stripeAccountId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok || !data.id) {
    throw new Error(
      `Stripe account fetch failed (${response.status}): ${String(
        data?.error?.message || text,
      ).slice(0, 300)}`,
    );
  }

  return data;
};

const resolveOnboardingStatus = (account) => {
  const due = Array.isArray(account?.requirements?.currently_due)
    ? account.requirements.currently_due
    : [];
  const cardPayments = String(account?.capabilities?.card_payments || "").toLowerCase();
  const transfers = String(account?.capabilities?.transfers || "").toLowerCase();

  if (due.length > 0) return "pending";
  if (account?.charges_enabled && account?.payouts_enabled) {
    if (cardPayments === "active" && transfers === "active") {
      return "complete";
    }
    return "restricted";
  }
  return "pending";
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
    if (!actorCanManageOwnStripe && actorRole !== "root") {
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
        message: "Only root can inspect another owner account",
      });
    }

    const targetUser = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      targetUserId,
    );
    if (!canManageOwnStripe(targetUser) && actorRole !== "root") {
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
      return json(res, 200, {
        ok: true,
        success: true,
        code: "STRIPE_ACCOUNT_NOT_STARTED",
        data: {
          userId: targetUserId,
          stripeAccountId: "",
          stripeOnboardingStatus: "not_started",
          capabilities: {
            card_payments: "inactive",
            transfers: "inactive",
          },
        },
      });
    }

    const account = await fetchStripeAccount({
      stripeSecretKey: config.stripeSecretKey,
      stripeAccountId,
    });

    const stripeOnboardingStatus = resolveOnboardingStatus(account);

    await db.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      targetUserId,
      {
        stripeOnboardingStatus,
      },
    );

    return json(res, 200, {
      ok: true,
      success: true,
      code: "STRIPE_ACCOUNT_STATUS_READY",
      data: {
        userId: targetUserId,
        stripeAccountId,
        stripeOnboardingStatus,
        capabilities: {
          card_payments: account?.capabilities?.card_payments || "inactive",
          transfers: account?.capabilities?.transfers || "inactive",
        },
        chargesEnabled: Boolean(account?.charges_enabled),
        payoutsEnabled: Boolean(account?.payouts_enabled),
        currentlyDue: Array.isArray(account?.requirements?.currently_due)
          ? account.requirements.currently_due
          : [],
      },
    });
  } catch (err) {
    error(`stripe-get-account-status failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
