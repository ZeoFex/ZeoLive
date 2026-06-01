import nodemailer from "nodemailer";

const DEFAULT_FROM = "zoefex.tech@gmail.com";

export function getEmailFrom() {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? DEFAULT_FROM;
}

function createTransport() {
  const user = (process.env.SMTP_USER ?? DEFAULT_FROM).trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");

  if (!pass) {
    return null;
  }

  const host = (process.env.SMTP_HOST ?? "smtp.gmail.com").trim().toLowerCase();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";

  // Manual host/port for smtp.gmail.com often causes "socket close" — use service preset.
  if (host === "smtp.gmail.com" || process.env.SMTP_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure && port === 587,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 15_000,
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const transport = createTransport();
  const from = getEmailFrom();

  if (!transport) {
    console.warn(
      "[Zeolive email] SMTP_PASS not set — logging email instead of sending:",
      { to: params.to, subject: params.subject }
    );
    console.info(params.text);
    return { ok: true, devMode: true };
  }

  await transport.sendMail({
    from: `Zeolive <${from}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html ?? params.text.replace(/\n/g, "<br>"),
  });

  return { ok: true, devMode: false };
}

/** Verify SMTP credentials (use in scripts or admin diagnostics). */
export async function verifySmtpConnection() {
  const transport = createTransport();
  if (!transport) {
    return { ok: false, error: "SMTP_PASS is not set" };
  }
  await transport.verify();
  return { ok: true };
}
