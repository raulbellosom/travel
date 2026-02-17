import nodemailer from "nodemailer";
import { Client, Databases } from "node-appwrite";

/* ─── Helpers ──────────────────────────────────────────── */

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
  conversationsCollectionId:
    getEnv("APPWRITE_COLLECTION_CONVERSATIONS_ID") || "conversations",
  messagesCollectionId: getEnv("APPWRITE_COLLECTION_MESSAGES_ID") || "messages",
  usersCollectionId: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
  appUrl: getEnv("APP_BASE_URL") || "http://localhost:5173",
  platformOwnerEmail: getEnv("PLATFORM_OWNER_EMAIL"),
});

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const getTransporter = () => {
  const host = getEnv("EMAIL_SMTP_HOST");
  const portRaw = getEnv("EMAIL_SMTP_PORT");
  const secureRaw = getEnv("EMAIL_SMTP_SECURE");
  const user = getEnv("EMAIL_SMTP_USER");
  const pass = getEnv("EMAIL_SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP config. Required: EMAIL_SMTP_HOST, EMAIL_SMTP_USER, EMAIL_SMTP_PASS",
    );
  }

  const port = Number(portRaw || 587);
  const secure = hasValue(secureRaw)
    ? String(secureRaw).toLowerCase() === "true"
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

/* ─── Main handler ─────────────────────────────────────── */

export default async ({ req, res, log, error }) => {
  const config = cfg();
  const body = parseBody(req);

  /* ── Validate ──────────────────────────────────────── */

  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const { conversationId, messageId, senderName, body: messageBody } = body;
  if (!conversationId || !senderName || !messageBody) {
    return res.json(
      {
        ok: false,
        error: "Missing required fields: conversationId, senderName, body",
      },
      400,
    );
  }

  /* ── Fetch conversation + determine recipient ──────── */

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const conversation = await db.getDocument(
      config.databaseId,
      config.conversationsCollectionId,
      conversationId,
    );

    // Determine who receives the notification (the other party)
    // The sender just sent a message, so we notify the other side.
    const senderIsClient =
      body.senderRole === "client" ||
      conversation.clientUserId === (req.headers?.["x-appwrite-user-id"] || "");

    const recipientUserId = senderIsClient
      ? conversation.ownerUserId
      : conversation.clientUserId;

    // Fetch recipient profile to get email
    const recipient = await db.getDocument(
      config.databaseId,
      config.usersCollectionId,
      recipientUserId,
    );

    const recipientEmail = recipient.email;
    if (!recipientEmail) {
      log("Recipient has no email, skipping notification.");
      return res.json({ ok: true, skipped: true }, 200);
    }

    /* ── Build & send email ────────────────────────────── */

    const fromName = getEnv("EMAIL_FROM_NAME") || "Inmobo";
    const fromAddress = getEnv("EMAIL_FROM_ADDRESS");

    if (!fromAddress) {
      return res.json(
        { ok: false, error: "Missing SMTP sender (EMAIL_FROM_ADDRESS)" },
        500,
      );
    }

    const recipientFirstName =
      recipient.firstName || recipientEmail.split("@")[0];
    const propertyTitle = conversation.propertyTitle || "una propiedad";

    const ccList = [];
    if (config.platformOwnerEmail) {
      ccList.push(config.platformOwnerEmail);
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: recipientEmail,
      cc: ccList.length ? ccList.join(", ") : undefined,
      subject: `Nuevo mensaje de ${senderName} sobre ${propertyTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Nuevo mensaje recibido</h2>
          <p>Hola <strong>${recipientFirstName}</strong>,</p>
          <p><strong>${senderName}</strong> te ha enviado un mensaje sobre <strong>${propertyTitle}</strong>:</p>
          <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #0ea5e9; background: #f0f9ff; border-radius: 4px; color: #334155;">
            ${messageBody}
          </blockquote>
          <p>
            <a href="${config.appUrl}/app/conversations?focus=${conversationId}"
               style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Responder en la plataforma
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            Este correo fue generado automaticamente por ${fromName}. No respondas a este email.
          </p>
        </div>
      `,
    });

    log(
      `Chat notification sent to ${recipientEmail} for conversation ${conversationId}`,
    );
    return res.json({ ok: true }, 200);
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
