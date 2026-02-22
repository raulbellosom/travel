import nodemailer from "nodemailer";

export function mustEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export function safeBodyJson(req) {
  try {
    const raw = req.body ?? req.payload ?? "{}";
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

export function json(res, status, body) {
  return res.json(body, status);
}

export async function sendEmail(to, subject, html) {
  const host = mustEnv("EMAIL_SMTP_HOST");
  const port = Number(process.env.EMAIL_SMTP_PORT || 587);
  const secure = String(process.env.EMAIL_SMTP_SECURE || "false") === "true";
  const user = mustEnv("EMAIL_SMTP_USER");
  const pass = mustEnv("EMAIL_SMTP_PASS");
  const fromName = process.env.EMAIL_FROM_NAME || "Inmobo";
  const fromAddress = mustEnv("EMAIL_FROM_ADDRESS");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
  });
}

export function buildPasswordResetEmailHtml({ link, appName }) {
  const name = appName || "Inmobo";
  return `
  <!doctype html>
  <html lang="es">
    <body style="margin:0;padding:24px;background:#0f172a;font-family:Arial,sans-serif;">
      <table role="presentation" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:24px;background:#0369a1;color:#f8fafc;">
            <h1 style="margin:0;font-size:22px;">${name}</h1>
            <p style="margin:8px 0 0 0;color:#e2e8f0;">Restablecimiento de contraseña</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;color:#334155;">
            <h2 style="margin:0 0 12px 0;color:#0f172a;">Cambia tu contraseña</h2>
            <p style="margin:0 0 16px 0;line-height:1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Si no fuiste tú, puedes ignorar este correo — tu contraseña no cambiará.
            </p>
            <a href="${link}"
               style="display:inline-block;padding:12px 18px;background:#0ea5e9;color:#0f172a;text-decoration:none;border-radius:10px;font-weight:700;">
              Restablecer contraseña
            </a>
            <p style="margin:18px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">
              Este enlace expira en <strong>60 minutos</strong>.<br/>
              Si el botón no abre, copia y pega este enlace:<br/>
              <a href="${link}" style="color:#0284c7;text-decoration:none;word-break:break-all;">${link}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;">
            © ${new Date().getFullYear()} ${name}. Todos los derechos reservados.
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
