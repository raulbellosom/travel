import { Client, Databases, ID, Query, Users } from "node-appwrite";
import {
  createModulesService,
  getBookingType,
  getCommercialMode,
  getRequiredBookingModule,
  requiresOnlinePayments,
  toModuleErrorResponse,
} from "./lib/modulesService.js";

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
  resourcesCollectionId:
    getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
  usersCollectionId: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
  reservationsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATIONS_ID") || "reservations",
  reservationPaymentsCollectionId:
    getEnv("APPWRITE_COLLECTION_RESERVATION_PAYMENTS_ID") || "reservation_payments",
  activityLogsCollectionId: getEnv("APPWRITE_COLLECTION_ACTIVITY_LOGS_ID") || "",
  instanceSettingsCollectionId:
    getEnv("APPWRITE_COLLECTION_INSTANCE_SETTINGS_ID") || "instance_settings",
  paymentDefaultProvider: getEnv("PAYMENT_DEFAULT_PROVIDER") || "stripe",
  paymentSuccessUrl: getEnv("PAYMENT_SUCCESS_URL") || "",
  paymentCancelUrl: getEnv("PAYMENT_CANCEL_URL") || "",
  stripeSecretKey: getEnv("STRIPE_SECRET_KEY") || "",
  stripePlatformFeePercent: Number(getEnv("STRIPE_PLATFORM_FEE_PERCENT") || 10),
  stripePlatformFeeFixed: Number(getEnv("STRIPE_PLATFORM_FEE_FIXED") || 0),
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

const getAuthenticatedUserId = (req) => {
  const headers = req.headers || {};
  return headers["x-appwrite-user-id"] || headers["x-appwrite-userid"] || "";
};

const toMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * 100) / 100;
};

const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

const normalizeDateMs = (value) => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const isPayoutEnabledForUser = (userDoc = {}) => {
  const role = normalizeText(userDoc.role, 40).toLowerCase();
  if (role === "owner" || role === "root") return true;
  return userDoc.stripePayoutsEnabled === true;
};

const computeApplicationFeeAmount = ({ amount, cfg }) => {
  const totalMinor = toMinorUnits(amount);
  if (totalMinor <= 0) return 0;

  const percent = Number.isFinite(cfg.stripePlatformFeePercent)
    ? Math.max(0, cfg.stripePlatformFeePercent)
    : 0;
  const fixedMinor = Number.isFinite(cfg.stripePlatformFeeFixed)
    ? Math.max(0, Math.round(cfg.stripePlatformFeeFixed * 100))
    : 0;
  const feeByPercent = Math.round(totalMinor * (percent / 100));
  return Math.min(totalMinor, feeByPercent + fixedMinor);
};

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

const resolveReservationResourceId = (reservation = {}) =>
  normalizeText(reservation.resourceId, 64);

const buildReturnUrl = ({ cfg, reservation, provider, status }) => {
  const candidate =
    status === "success" && cfg.paymentSuccessUrl
      ? cfg.paymentSuccessUrl
      : status === "cancel"
        ? cfg.paymentCancelUrl
        : "";

  if (candidate) return candidate;

  const resourceId = resolveReservationResourceId(reservation);
  const base = String(cfg.appBaseUrl || "http://localhost:5173").replace(/\/$/, "");
  const params = new URLSearchParams({
    reservationId: reservation.$id,
    provider,
    status,
  });
  return `${base}/reservar/${encodeURIComponent(resourceId)}?${params.toString()}`;
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

const createStripeSession = async ({
  cfg,
  reservation,
  amount,
  currency,
  stripeAccountId,
  applicationFeeAmount,
}) => {
  if (!cfg.stripeSecretKey) {
    return buildMockSession({ cfg, reservation, provider: "stripe" });
  }

  const resourceId = resolveReservationResourceId(reservation);
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
    "metadata[resourceId]": resourceId,
    "payment_intent_data[transfer_data][destination]": stripeAccountId,
    "payment_intent_data[application_fee_amount]": String(applicationFeeAmount),
    "payment_intent_data[on_behalf_of]": stripeAccountId,
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

  const resourceId = resolveReservationResourceId(reservation);
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
        resourceId,
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

const upsertPaymentDocument = async ({
  db,
  config,
  existingPending,
  paymentData,
}) => {
  try {
    if (existingPending) {
      return await db.updateDocument(
        config.databaseId,
        config.reservationPaymentsCollectionId,
        existingPending.$id,
        paymentData,
      );
    }

    return await db.createDocument(
      config.databaseId,
      config.reservationPaymentsCollectionId,
      ID.unique(),
      paymentData,
    );
  } catch {
    if (existingPending) {
      return db.updateDocument(
        config.databaseId,
        config.reservationPaymentsCollectionId,
        existingPending.$id,
        paymentData,
      );
    }

    return db.createDocument(
      config.databaseId,
      config.reservationPaymentsCollectionId,
      ID.unique(),
      paymentData,
    );
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
  const authenticatedUserId = normalizeText(getAuthenticatedUserId(req), 64);
  const guestEmail = normalizeText(payload.guestEmail, 254).toLowerCase();
  const providerRaw = normalizeText(
    payload.provider || config.paymentDefaultProvider,
    20,
  ).toLowerCase();

  if (!authenticatedUserId) {
    return json(res, 401, {
      ok: false,
      success: false,
      code: "AUTH_REQUIRED",
      message: "You must be authenticated to create a payment session",
    });
  }

  if (!reservationId) {
    return json(res, 400, {
      ok: false,
      success: false,
      code: "VALIDATION_ERROR",
      message: "reservationId is required",
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
  const users = new Users(client);
  const modulesService = createModulesService({ db, config });

  try {
    const authUser = await users.get(authenticatedUserId);
    const authEmail = normalizeText(authUser.email, 254).toLowerCase();
    if (!authEmail) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "AUTH_EMAIL_MISSING",
        message: "Authenticated account has no email configured",
      });
    }

    if (!authUser.emailVerification) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before creating a payment session",
      });
    }

    if (guestEmail && guestEmail !== authEmail) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "GUEST_EMAIL_MISMATCH",
        message: "guestEmail must match the authenticated account email",
      });
    }

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

    const reservationGuestUserId = normalizeText(reservation.guestUserId, 64);
    const reservationGuestEmail = normalizeText(reservation.guestEmail, 254).toLowerCase();
    const hasLegacyGuest = !reservationGuestUserId && reservationGuestEmail;

    if (!reservationGuestUserId && !reservationGuestEmail) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "RESERVATION_GUEST_MISSING",
        message: "Reservation guest identity is not configured",
      });
    }

    if (reservationGuestUserId && reservationGuestUserId !== authenticatedUserId) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "PAYMENT_UNAUTHORIZED",
        message: "Authenticated user does not match reservation guest",
      });
    }

    if (hasLegacyGuest && reservationGuestEmail !== authEmail) {
      return json(res, 403, {
        ok: false,
        success: false,
        code: "PAYMENT_UNAUTHORIZED",
        message: "Authenticated email does not match reservation guest email",
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

    if (reservation.status !== "pending") {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_NOT_PENDING",
        message: "Only pending reservations can start payment",
      });
    }

    const holdExpiresMs = normalizeDateMs(reservation.holdExpiresAt);
    if (
      holdExpiresMs !== null &&
      holdExpiresMs <= Date.now() &&
      String(reservation.paymentStatus || "").toLowerCase() === "unpaid"
    ) {
      await db
        .updateDocument(
          config.databaseId,
          config.reservationsCollectionId,
          reservationId,
          { status: "expired" },
        )
        .catch(() => {});
      return json(res, 409, {
        ok: false,
        success: false,
        code: "RESERVATION_HOLD_EXPIRED",
        message: "Reservation hold expired. Please create a new reservation.",
      });
    }

    const resourceId = resolveReservationResourceId(reservation);
    if (!resourceId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "RESERVATION_RESOURCE_MISSING",
        message: "Reservation resource is not configured",
      });
    }

    await modulesService.assertModuleEnabled("module.resources");

    const resource = await db.getDocument(
      config.databaseId,
      config.resourcesCollectionId,
      resourceId,
    );

    const commercialMode = getCommercialMode(resource);
    const bookingType = getBookingType(resource, commercialMode);

    if (bookingType === "manual_contact") {
      return json(res, 409, {
        ok: false,
        success: false,
        code: "MANUAL_CONTACT_ONLY",
        message: "This resource uses manual contact flow and does not support checkout",
      });
    }

    const requiredBookingModule = getRequiredBookingModule(commercialMode);
    if (requiredBookingModule) {
      await modulesService.assertModuleEnabled(requiredBookingModule);
    }

    if (requiresOnlinePayments(commercialMode, bookingType)) {
      await modulesService.assertModuleEnabled("module.payments.online");
    }

    const reservationOwnerUserId = normalizeText(
      reservation.resourceOwnerUserId || reservation.propertyOwnerId,
      64,
    );
    if (!reservationOwnerUserId) {
      return json(res, 422, {
        ok: false,
        success: false,
        code: "RESOURCE_OWNER_MISSING",
        message: "Reservation owner is not configured",
      });
    }

    const owner = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      reservationOwnerUserId,
    );
    const stripeAccountId = normalizeText(owner.stripeAccountId, 120);
    const stripeOnboardingStatus = normalizeText(
      owner.stripeOnboardingStatus || "not_started",
      40,
    ).toLowerCase();

    if (providerRaw === "stripe") {
      if (!isPayoutEnabledForUser(owner)) {
        return json(res, 409, {
          ok: false,
          success: false,
          code: "OWNER_PAYOUT_NOT_ENABLED",
          message:
            "Stripe payouts are not enabled for this resource owner user.",
        });
      }
      if (!stripeAccountId) {
        return json(res, 409, {
          ok: false,
          success: false,
          code: "OWNER_STRIPE_ACCOUNT_REQUIRED",
          message: "Owner Stripe account is missing. Online payments are blocked.",
        });
      }
      if (stripeOnboardingStatus !== "complete") {
        return json(res, 409, {
          ok: false,
          success: false,
          code: "OWNER_STRIPE_ONBOARDING_INCOMPLETE",
          message: "Owner Stripe onboarding is incomplete. Online payments are blocked.",
        });
      }
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
          resourceId,
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
            stripeAccountId,
            applicationFeeAmount: computeApplicationFeeAmount({
              amount,
              cfg: config,
            }),
          })
        : await createMercadoPagoPreference({
            cfg: config,
            reservation,
            amount,
            currency,
          });

    const paymentData = {
      reservationId,
      resourceId,
      resourceOwnerUserId: reservationOwnerUserId,
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

    const paymentDocument = await upsertPaymentDocument({
      db,
      config,
      existingPending,
      paymentData,
    });

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
        actorUserId: authenticatedUserId,
        actorRole: "client",
        action: "payment.session_created",
        entityType: "reservation_payments",
        entityId: paymentDocument.$id,
        afterData: safeJsonString({
          reservationId,
          resourceId,
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
        resourceId,
                provider: providerRaw,
        providerPaymentId: session.providerPaymentId,
        checkoutUrl: session.checkoutUrl,
        mode: session.mode,
        reused: false,
      },
    });
  } catch (err) {
    if (err?.code === "MODULE_DISABLED" || err?.code === "LIMIT_EXCEEDED") {
      const moduleError = toModuleErrorResponse(err);
      return json(res, moduleError.status, moduleError.body);
    }

    error(`create-payment-session failed: ${err.message}`);
    return json(res, 500, {
      ok: false,
      success: false,
      code: "INTERNAL_ERROR",
      message: err.message,
    });
  }
};

