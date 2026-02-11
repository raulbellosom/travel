import nodemailer from "nodemailer";
import { Client, Databases } from "node-appwrite";

const cfg = () => ({
  endpoint: process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT,
  projectId:
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  databaseId: process.env.APPWRITE_DATABASE_ID || "main",
  propertiesCollectionId: process.env.APPWRITE_COLLECTION_PROPERTIES_ID || "properties",
  usersCollectionId: process.env.APPWRITE_COLLECTION_USERS_ID || "users",
  appUrl: process.env.APP_URL || "http://localhost:5173",
});

const parseBody = (req) => {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_PORT || "") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

export default async ({ req, res, log, error }) => {
  const config = cfg();
  const body = parseBody(req);
  if (!config.endpoint || !config.projectId || !config.apiKey) {
    return res.json({ ok: false, error: "Missing Appwrite credentials" }, 500);
  }

  const propertyId = body.propertyId;
  const propertyOwnerId = body.propertyOwnerId;
  if (!propertyId || !propertyOwnerId) {
    return res.json({ ok: false, error: "Invalid lead payload" }, 400);
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const db = new Databases(client);

  try {
    const [property, owner] = await Promise.all([
      db.getDocument(config.databaseId, config.propertiesCollectionId, propertyId),
      db.getDocument(config.databaseId, config.usersCollectionId, propertyOwnerId),
    ]);

    const ownerEmail = owner.email;
    if (!ownerEmail) {
      return res.json({ ok: false, error: "Owner email not found" }, 404);
    }

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Real Estate SaaS"}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: ownerEmail,
      subject: `Nuevo lead para ${property.title}`,
      html: `
        <h2>Nuevo lead recibido</h2>
        <p><strong>Propiedad:</strong> ${property.title}</p>
        <p><strong>Nombre:</strong> ${body.name || "-"}</p>
        <p><strong>Email:</strong> ${body.email || "-"}</p>
        <p><strong>Teléfono:</strong> ${body.phone || "-"}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${body.message || "-"}</p>
        <p><a href="${config.appUrl}/leads">Ver leads en dashboard</a></p>
      `,
    });

    log(`Lead notification sent to ${ownerEmail}`);
    return res.json({ ok: true }, 200);
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
