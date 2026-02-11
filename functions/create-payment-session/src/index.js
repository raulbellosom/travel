import { Client, Databases, ID, Query } from "node-appwrite";

const SUPPORTED_PROVIDERS = ["stripe", "mercadopago"];
const SUPPORTED_CURRENCIES = ["MXN", "USD", "EUR"];

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
  appBaseUrl: getEnv("APP_BASE_URL") || "http://localhost:5173",
  reservationsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  reservationPaymentsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID") || "reservation_payments",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
  paymentDefaultProvider: getEnv("PAYMENT_DEFAULT_PROVIDER") || "stripe",
  paymentSuccessUrl: getEnv("PAYMENT_SUCCESS_URL") || "",
  paymentCancelUrl: getEnv("PAYMENT_CANCEL_URL") || "",
  stripeSecretKey: getEnv("STRIPE_SECRET_KEY") || "",
  mercadopagoAccessToken: getEnv("MERCADOPAGO_ACCESS_TOKEN") || "",
});

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const json = (res, status, body) => res.json(body, status);

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const toMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * 100) / 100;
};

const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

const safeJsonString = (value, maxLength = 20000) => {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
};

const parseRawPayload = (payloadText) => {
  if (!hasValue(payloadText)) return {};
  try {
    return JSON.parse(payloadText);
  } catch {
    return {};
  }
};

const getCheckoutFromRaw = (rawPayload) => {
  const parsed = parseRawPayload(rawPayload);
  return parsed.checkoutUrl || "";
};

const buildReturnUrl = ({ cfg, reservation, provider, status }) => {
  const candidate =
    status === "success" && cfg.paymentSuccessUrl
      ? cfg.paymentSuccessUrl
      : status === "cancel"
        ? cfg.paymentCancelUrl
        : "";

  if (candidate) return candidate;

  const base = String(cfg.appBaseUrl || "http://localhost:5173").replace(/\/$/, "");
  const params = new URLSearchParams({
    reservationId: reservation.$id,
    provider,
    status,
  });
  return `${base}/reservar/${encodeURIComponent(reservation.propertyId)}?${params.toString()}`;
};

const buildMockSession = ({ cfg, reservation, provider }) => {
  const providerPaymentId = `mock_${provider}_${ID.unique()}`.slice(0, 120);
  const checkoutUrl = buildReturnUrl({
    cfg,
    reservation,
    provider,
    status: "success",
  });

  return {
    mode: "mock",
    providerPaymentId,
    checkoutUrl,
    raw: {
      mode: "mock",
      provider,
      reservationId: reservation.$id,
      providerPaymentId,
      checkoutUrl,
    },
  };
};

const createStripeSession = async ({ cfg, reservation, amount, currency }) => {
  if (!cfg.stripeSecretKey) {
    return buildMockSession({ cfg, reservation, provider: "stripe" });
  }

  const successUrl = buildReturnUrl({
    cfg,
    reservation,
    provider: "stripe",
    status: "success",
  });
  const cancelUrl = buildReturnUrl({
    cfg,
    reservation,
    provider: "stripe",
    status: "cancel",
  });

  const payload = new URLSearchParams({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    "line_items[0][price_data][currency]": currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(toMinorUnits(amount)),
    "line_items[0][price_data][product_data][name]": `Reservation ${reservation.$id}`,
    "line_items[0][quantity]": "1",
    "metadata[reservationId]": reservation.$id,
    "metadata[propertyId]": reservation.propertyId,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.stripeSecretKey}`,
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

  if (!response.ok || !data.id) {
    throw new Error(
      `Stripe session creation failed (${response.status}): ${String(
        data?.error?.message || text,
      ).slice(0, 300)}`,
    );
  }

  return {
    mode: "live",
    providerPaymentId: String(data.id).slice(0, 120),
    checkoutUrl: String(data.url || "").slice(0, 750),
    raw: data,
  };
};

const currencyToMercadoPago = (currency) => {
  if (currency === "USD") return "USD";
  if (currency === "EUR") return "EUR";
  return "MXN";
};

const createMercadoPagoPreference = async ({ cfg, reservation, amount, currency }) => {
  if (!cfg.mercadopagoAccessToken) {
    return buildMockSession({ cfg, reservation, provider: "mercadopago" });
  }

  const successUrl = buildReturnUrl({
    cfg,
    reservation,
    provider: "mercadopago",
    status: "success",
  });
  const cancelUrl = buildReturnUrl({
    cfg,
    reservation,
    provider: "mercadopago",
    status: "cancel",
  });

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.mercadopagoAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_reference: reservation.$id,
      back_urls: {
        success: successUrl,
        failure: cancelUrl,
        pending: cancelUrl,
      },
      auto_return: "approved",
      items: [
        {
          id: reservation.$id,
          title: `Reservation ${reservation.$id}`,
          quantity: 1,
          currency_id: currencyToMercadoPago(currency),
          unit_price: amount,
        },
      ],
      metadata: {
        reservationId: reservation.$id,
        propertyId: reservation.propertyId,
      },
    }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok || !data.id) {
    throw new Error(
      `Mercado Pago preference creation failed (${response.status}): ${String(
        data?.message || data?.cause?.[0]?.description || text,
      ).slice(0, 300)}`,
    );
  }

  return {
    mode: "live",
    providerPaymentId: String(data.id).slice(0, 120),
    checkoutUrl: String(data.init_point || data.sandbox_init_point || "").slice(0, 750),
    raw: data,
  };
};

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

export default async ({ req, res, log, error }) => {
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

  const payload = parseBody(req);
  const reservationId = normalizeText(payload.reservationId, 64);
  const guestEmail = normalizeText(payload.guestEmail, 254).toLowerCase();
  const providerRaw = normalizeText(
    payload.provider || config.paymentDefaultProvider,
    20,
  ).toLowerCase();

  if (!reservationId || !guestEmail) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "reservationId and guestEmail are required",
    });
  }

  if (!SUPPORTED_PROVIDERS.includes(providerRaw)) {
    return json(res, 422, {
      ok: false,
      success: false,
      code: "PAYMENT_PROVIDER_NOT_SUPPORTED",
      message: `Supported providers: ${SUPPORTED_PROVIDERS.join(", ")}`,
    });
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const reservation = await db.getDocument(
      config.databaseId,
      config.reservationsCollectionId,
      reservationId,
    );

    if (reservation.enabled !== true) {
      return json(res, 404, {
        ok: false,
        success: false,
        code: "RESERVATION_NOT_AVAILABLE",
        message: "Reservation is not available",
      });
    }

    if (String(reservation.guestEmail || "").toLowerCase() !== guestEmail) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "PAYMENT_UNAUTHORIZED",
        message: "Guest identity mismatch",
      });
    }

    if (reservation.status === "cancelled" || reservation.status === "expired") {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_NOT_PAYABLE",
        message: `Reservation status ${reservation.status} cannot be paid`,
      });
    }

    if (reservation.paymentStatus === "paid") {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_ALREADY_PAID",
        message: "Reservation is already paid",
      });
    }

    const amount = toMoney(reservation.totalAmount || 0);
    if (amount === null || amount <= 0) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AMOUNT_INVALID",
        message: "Reservation totalAmount must be greater than zero",
      });
    }

    const currency = String(reservation.currency || "MXN").toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "CURRENCY_NOT_SUPPORTED",
        message: `Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
      });
    }

    const pendingResult = await db.listDocuments(
      config.databaseId,
      config.reservationPaymentsCollectionId,
      [
        Query.equal("reservationId", reservationId),
        Query.equal("provider", providerRaw),
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    );

    const existingPending = pendingResult.documents?.[0] || null;
    const existingCheckoutUrl = existingPending
      ? getCheckoutFromRaw(existingPending.rawPayload)
      : "";

    if (existingPending && existingCheckoutUrl) {
      return json(res, 200, {
        ok: true,
        success: true,
        code: "PAYMENT_SESSION_REUSED",
        message: "Existing pending payment session reused",
        data: {
          paymentId: existingPending.$id,
          reservationId,
          provider: providerRaw,
          providerPaymentId: existingPending.providerPaymentId,
          checkoutUrl: existingCheckoutUrl,
          mode: parseRawPayload(existingPending.rawPayload).mode || "unknown",
          reused: true,
        },
      });
    }

    const session =
      providerRaw === "stripe"
        ? await createStripeSession({
            cfg: config,
            reservation,
            amount,
            currency,
          })
        : await createMercadoPagoPreference({
            cfg: config,
            reservation,
            amount,
            currency,
          });

    const paymentData = {
      reservationId,
      propertyOwnerId: reservation.propertyOwnerId,
      provider: providerRaw,
      providerPaymentId: String(session.providerPaymentId || "").slice(0, 120),
      amount,
      currency,
      status: "pending",
      rawPayload: safeJsonString({
        ...session.raw,
        checkoutUrl: session.checkoutUrl,
        mode: session.mode,
      }),
      enabled: true,
    };

    let paymentDocument;
    if (existingPending) {
      paymentDocument = await db.updateDocument(
        config.databaseId,
        config.reservationPaymentsCollectionId,
        existingPending.$id,
        paymentData,
      );
    } else {
      paymentDocument = await db.createDocument(
        config.databaseId,
        config.reservationPaymentsCollectionId,
        ID.unique(),
        paymentData,
      );
    }

    await db.updateDocument(
      config.databaseId,
      config.reservationsCollectionId,
      reservationId,
      {
        paymentStatus: "pending",
        paymentProvider: providerRaw,
        externalRef: String(session.providerPaymentId || "").slice(0, 120),
      },
    );

    await safeActivityLog({
      db,
      config,
      logger: log,
      data: {
        actorUserId: reservation.propertyOwnerId,
        actorRole: "owner",
        action: "payment.session_created",
        entityType: "reservation_payments",
        entityId: paymentDocument.$id,
        afterData: safeJsonString({
          reservationId,
          provider: providerRaw,
          providerPaymentId: session.providerPaymentId,
          amount,
          currency,
          status: "pending",
          mode: session.mode,
        }),
        severity: "info",
      },
    });

    return json(res, 200, {
      ok: true,
      success: true,
      code: "PAYMENT_SESSION_CREATED",
      message: "Payment session created",
      data: {
        paymentId: paymentDocument.$id,
        reservationId,
        provider: providerRaw,
        providerPaymentId: session.providerPaymentId,
        checkoutUrl: session.checkoutUrl,
        mode: session.mode,
        reused: false,
      },
    });
  } catch (err) {
    error(`create-payment-session failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};
