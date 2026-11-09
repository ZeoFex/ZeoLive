import { config } from "dotenv";
import nodemailer from "nodemailer";

// Force .env.local over any pre-injected shell SMTP_* values.
config({ path: ".env.local", override: true });

const channel = (process.argv[2] ?? "support").toLowerCase();

const configs = {
  support: {
    user: (process.env.SMTP_USER_SUPPORT ?? process.env.SMTP_USER ?? "").trim(),
    pass: (process.env.SMTP_PASS_SUPPORT ?? process.env.SMTP_PASS ?? "").replace(
      /\s/g,
      ""
    ),
    from: process.env.SMTP_FROM_SUPPORT ?? process.env.SMTP_FROM,
  },
  welcome: {
    user: (process.env.SMTP_USER_WELCOME ?? process.env.SMTP_USER ?? "").trim(),
    pass: (process.env.SMTP_PASS_WELCOME ?? process.env.SMTP_PASS ?? "").replace(
      /\s/g,
      ""
    ),
    from: process.env.SMTP_FROM_WELCOME ?? process.env.SMTP_FROM,
  },
};

const selected = configs[channel];
if (!selected) {
  console.error(
    "Usage: node --env-file=.env.local scripts/test-smtp.mjs [welcome|support]"
  );
  process.exit(1);
}

if (!selected.user || !selected.pass) {
  console.error(`Missing SMTP credentials for channel "${channel}" in .env.local`);
  process.exit(1);
}

const host = (process.env.SMTP_HOST ?? "mail.privateemail.com").trim().toLowerCase();
const port = Number(process.env.SMTP_PORT ?? 465);
const secure = process.env.SMTP_SECURE === "true" || port === 465;
const useGmailService = host === "smtp.gmail.com";

const transport = useGmailService
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: selected.user, pass: selected.pass },
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: { user: selected.user, pass: selected.pass },
      requireTLS: !secure,
    });

console.log("Channel:", channel);
console.log("Testing SMTP as:", selected.user);
console.log("From:", selected.from);
console.log("Host:", process.env.SMTP_HOST, "port:", port, "secure:", secure);

try {
  await transport.verify();
  console.log("OK — SMTP connection verified");
} catch (err) {
  console.error("FAILED:", err.message);
  if (err.code) console.error("Code:", err.code);
  if (err.response) console.error("Response:", err.response);
  process.exit(1);
}
