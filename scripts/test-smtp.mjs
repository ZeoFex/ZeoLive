import "dotenv/config";
import nodemailer from "nodemailer";

const user = (process.env.SMTP_USER ?? "").trim();
const pass = process.env.SMTP_PASS?.replace(/\s/g, "");

if (!user || !pass) {
  console.error("Missing SMTP_USER or SMTP_PASS in .env.local");
  process.exit(1);
}

const host = (process.env.SMTP_HOST ?? "smtp.gmail.com").trim().toLowerCase();
const useGmailService = host === "smtp.gmail.com";

const transport = useGmailService
  ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
      requireTLS: process.env.SMTP_SECURE !== "true",
    });

console.log("Testing SMTP as:", user);
console.log("Mode:", useGmailService ? "gmail service" : process.env.SMTP_HOST);

try {
  await transport.verify();
  console.log("OK — SMTP connection verified");
} catch (err) {
  console.error("FAILED:", err.message);
  if (err.code) console.error("Code:", err.code);
  if (err.response) console.error("Response:", err.response);
  process.exit(1);
}
