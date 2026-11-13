import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type EmailChannel = "welcome" | "support";

const DEFAULT_FROM = "ZTL Support <support@zeohost.store>";

type ChannelConfig = {
  user: string;
  pass: string | undefined;
  from: string;
};

function cleanPass(value: string | undefined) {
  return value?.replace(/\s/g, "") || undefined;
}

function channelConfig(channel: EmailChannel): ChannelConfig {
  if (channel === "welcome") {
    return {
      user: (
        process.env.SMTP_USER_WELCOME ??
        process.env.SMTP_USER ??
        "welcome@zeohost.store"
      ).trim(),
      pass: cleanPass(
        process.env.SMTP_PASS_WELCOME ?? process.env.SMTP_PASS
      ),
      from: (
        process.env.SMTP_FROM_WELCOME ??
        process.env.SMTP_FROM ??
        "ZTL <welcome@zeohost.store>"
      ).trim(),
    };
  }

  return {
    user: (
      process.env.SMTP_USER_SUPPORT ??
      process.env.SMTP_USER ??
      "support@zeohost.store"
    ).trim(),
    pass: cleanPass(process.env.SMTP_PASS_SUPPORT ?? process.env.SMTP_PASS),
    from: (
      process.env.SMTP_FROM_SUPPORT ??
      process.env.SMTP_FROM ??
      DEFAULT_FROM
    ).trim(),
  };
}

function resolveSmtpEndpoint(user: string) {
  const configuredHost = (process.env.SMTP_HOST ?? "").trim().toLowerCase();
  const isZeohostMailbox = user.toLowerCase().endsWith("@zeohost.store");
  const staleGmailHost =
    !configuredHost ||
    configuredHost === "smtp.gmail.com" ||
    process.env.SMTP_SERVICE === "gmail";

  // Prefer Namecheap Private Email for zeohost mailboxes even if an old
  // Gmail SMTP_HOST is still present in the process environment.
  if (isZeohostMailbox && staleGmailHost) {
    return {
      host: "mail.privateemail.com",
      port: 465,
      secure: true,
      useGmailService: false,
    };
  }

  const port = Number(process.env.SMTP_PORT ?? (configuredHost ? 587 : 465));
  const secure =
    process.env.SMTP_SECURE === "true" ||
    port === 465 ||
    (!process.env.SMTP_PORT && !configuredHost);

  return {
    host: configuredHost || "mail.privateemail.com",
    port,
    secure,
    useGmailService:
      configuredHost === "smtp.gmail.com" || process.env.SMTP_SERVICE === "gmail",
  };
}

function createTransport(channel: EmailChannel) {
  const { user, pass } = channelConfig(channel);

  if (!pass) {
    return null;
  }

  const endpoint = resolveSmtpEndpoint(user);

  if (endpoint.useGmailService) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  const options: SMTPTransport.Options = {
    host: endpoint.host,
    port: endpoint.port,
    secure: endpoint.secure,
    auth: { user, pass },
    requireTLS: !endpoint.secure && endpoint.port === 587,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 15_000,
  };

  return nodemailer.createTransport(options);
}

/** Inbox name is always ZTL. The address still comes from SMTP settings. */
export function getEmailFrom(channel: EmailChannel = "support") {
  const config = channelConfig(channel);
  const match = config.from.match(/<([^>]+)>/);
  const address =
    match?.[1]?.trim() || (config.from.includes("@") ? config.from.trim() : config.user);
  const label = channel === "support" ? "ZTL Support" : "ZTL";
  return `${label} <${address}>`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** welcome = account/login; support = bookings, recovery, ops */
  channel?: EmailChannel;
  attachments?: { filename: string; content: string; contentType: string }[];
}) {
  const channel = params.channel ?? "support";
  const transport = createTransport(channel);
  const from = getEmailFrom(channel);

  if (!transport) {
    console.warn(
      `[Zeolive email] SMTP pass not set for ${channel} — logging email instead of sending:`,
      { to: params.to, subject: params.subject, channel }
    );
    console.info(params.text);
    return { ok: true, devMode: true, channel };
  }

  await transport.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html ?? params.text.replace(/\n/g, "<br>"),
    attachments: params.attachments?.map((file) => ({
      filename: file.filename,
      content: file.content,
      contentType: file.contentType,
    })),
  });

  return { ok: true, devMode: false, channel };
}

/** Verify SMTP credentials for a channel (scripts / diagnostics). */
export async function verifySmtpConnection(channel: EmailChannel = "support") {
  const transport = createTransport(channel);
  if (!transport) {
    return { ok: false, error: `SMTP pass is not set for ${channel}` };
  }
  await transport.verify();
  return { ok: true, channel };
}
