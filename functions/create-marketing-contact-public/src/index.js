import nodemailer from "nodemailer";
import { Client, Databases, ID } from "node-appwrite";

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
  contactsCollectionId:
    getEnv("APPWRITE_COLLECTION_MARKETING_CONTACTS_ID") ||
    "marketing_contacts",
  ownerEmail: getEnv("PLATFORM_OWNER_EMAIL"),
  appName: getEnv("APP_NAME") || "Inmobo",
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

const normalizeText = (value, maxLength = 0) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));

const getTransporter = () => {
  const host = getEnv("EMAIL_SMTP_HOST");
  const portRaw = getEnv("EMAIL_SMTP_PORT");
  const secureRaw = getEnv("EMAIL_SMTP_SECURE");
  const user = getEnv("EMAIL_SMTP_USER");
  const pass = getEnv("EMAIL_SMTP_PASS");

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(portRaw || 587);
  const secure =
    hasValue(secureRaw) ? String(secureRaw).toLowerCase() === "true" : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const sendOwnerNotification = async ({ contact, config }) => {
  const transporter = getTransporter();
  const fromAddress = getEnv("EMAIL_FROM_ADDRESS");

  if (!transporter || !fromAddress || !config.ownerEmail) {
    return { emailSent: false };
  }

  const fromName = getEnv("EMAIL_FROM_NAME") || config.appName;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: config.ownerEmail,
    subject: `[${config.appName}] Nuevo contacto desde CRM Landing`,
    html: `
      <h2>Nuevo contacto</h2>
      <p><strong>Nombre:</strong> ${contact.name} ${contact.lastName || ""}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Telefono:</strong> ${contact.phone || "-"}</p>
      <p><strong>Idioma:</strong> ${contact.locale || "-"}</p>
      <p><strong>Origen:</strong> ${contact.source || "crm_landing_contact"}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${contact.message}</p>
      <p><a href="${config.appUrl}">${config.appUrl}</a></p>
    `,
  });

  return { emailSent: true };
};

export default async ({ req, res, error }) => {
  const config = cfg();
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const body = parseBody(req);
  const name = normalizeText(body.name, 120);
  const lastName = normalizeText(body.lastName, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const phone = normalizeText(body.phone, 25);
  const message = normalizeText(body.message, 4000);
  const locale = normalizeText(body.locale, 12);
  const source = normalizeText(body.source, 80) || "crm_landing_contact";

  if (!name || !email || !message) {
    return res.json({ ok: false, error: "Missing required fields" }, 400);
  }

  if (!isValidEmail(email)) {
    return res.json({ ok: false, error: "Invalid email format" }, 400);
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const payload = {
      name,
      email,
      message,
      status: "new",
      source,
      locale: locale || "es",
      enabled: true,
    };

    if (lastName) payload.lastName = lastName;
    if (phone) payload.phone = phone;

    const doc = await db.createDocument(
      config.databaseId,
      config.contactsCollectionId,
      ID.unique(),
      payload,
    );

    const notification = await sendOwnerNotification({
      contact: payload,
      config,
    }).catch(() => ({ emailSent: false }));

    return res.json(
      {
        ok: true,
        contactId: doc.$id,
        emailSent: notification.emailSent,
      },
      200,
    );
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
