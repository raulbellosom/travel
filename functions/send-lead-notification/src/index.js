import nodemailer from "nodemailer";
import { Client, Databases } from "node-appwrite";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const getEnv = (...keys) => {
  for (const key of keys) {
    if (hasValue(process.env[key])) {
      return process.env[key];
    }
  }
  return "";
};

const cfg = () => ({
  endpoint: getEnv("APPWRITE_FUNCTION_ENDPOINT", "APPWRITE_ENDPOINT"),
  projectId: getEnv("APPWRITE_FUNCTION_PROJECT_ID", "APPWRITE_PROJECT_ID"),
  apiKey: getEnv("APPWRITE_FUNCTION_API_KEY", "APPWRITE_API_KEY"),
  databaseId: getEnv("APPWRITE_DATABASE_ID") || "main",
  resourcesCollectionId:
    getEnv("APPWRITE_COLLECTION_RESOURCES_ID") || "resources",
  usersCollectionId: getEnv("APPWRITE_COLLECTION_USERS_ID") || "users",
  appUrl: getEnv("APP_BASE_URL") || "http://localhost:5173",
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
      "Missing SMTP config. Required: EMAIL_SMTP_HOST, EMAIL_SMTP_USER, EMAIL_SMTP_PASS"
    );
  }

  const port = Number(portRaw || 587);
  const secure =
    hasValue(secureRaw) ? String(secureRaw).toLowerCase() === "true" : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

export default async ({ req, res, log, error }) => {
  const config = cfg();
  const body = parseBody(req);

  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const resourceId = body.resourceId;
  const resourceOwnerUserId = body.resourceOwnerUserId;
  if (!resourceId || !resourceOwnerUserId) {
    return res.json({ ok: false, error: "Invalid lead payload" }, 400);
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const [resource, owner] = await Promise.all([
      db.getDocument(config.databaseId, config.resourcesCollectionId, resourceId),
      db.getDocument(config.databaseId, config.usersCollectionId, resourceOwnerUserId),
    ]);

    const ownerEmail = owner.email;
    if (!ownerEmail) {
      return res.json({ ok: false, error: "Owner email not found" }, 404);
    }

    const fromName = getEnv("EMAIL_FROM_NAME") || "Inmobo";
    const fromAddress = getEnv("EMAIL_FROM_ADDRESS");

    if (!fromAddress) {
      return res.json(
        { ok: false, error: "Missing SMTP sender address (EMAIL_FROM_ADDRESS)" },
        500
      );
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: ownerEmail,
      subject: `Nuevo lead para ${resource.title}`,
      html: `
        <h2>Nuevo lead recibido</h2>
        <p><strong>Recurso:</strong> ${resource.title}</p>
        <p><strong>Nombre:</strong> ${body.name || "-"}</p>
        <p><strong>Email:</strong> ${body.email || "-"}</p>
        <p><strong>Telefono:</strong> ${body.phone || "-"}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${body.message || "-"}</p>
        <p><a href="${config.appUrl}/app/leads">Ver leads en dashboard</a></p>
      `,
    });

    log(`Lead notification sent to ${ownerEmail}`);
    return res.json({ ok: true }, 200);
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
