import { loginUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/transport";

export function buildWelcomeEmail(params: {
  name: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  loginPageUrl?: string;
}) {
  const loginPage = params.loginPageUrl ?? loginUrl();
  const roleLabel =
    params.role === "TUTOR"
      ? "tutor"
      : params.role === "ADMIN"
        ? "admin"
        : "student";

  const nextStep =
    params.role === "TUTOR"
      ? "Log in to complete verification and upload your documents."
      : params.role === "ADMIN"
        ? "Log in to access the admin dashboard."
        : "Log in to browse tutors and book your first live session.";

  const text = `Hello ${params.name},

Welcome to ZTL! Your ${roleLabel} account has been created successfully.

${nextStep}

Sign in here:
${loginPage}

If you did not create this account, you can ignore this email.

Regards,
ZTL`;

  const html = `
    <p>Hello ${params.name},</p>
    <p>Welcome to ZTL! Your <strong>${roleLabel}</strong> account has been created successfully.</p>
    <p>${nextStep}</p>
    <p><a href="${loginPage}">Sign in to ZTL</a></p>
    <p>If you did not create this account, you can ignore this email.</p>
    <p>Regards,<br>ZTL</p>
  `.trim();

  return {
    subject: "Welcome to ZTL — your account is ready",
    text,
    html,
  };
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
}) {
  const email = buildWelcomeEmail({
    name: params.name,
    role: params.role,
  });
  return sendEmail({
    channel: "welcome",
    to: params.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}

export function buildLoginNoticeEmail(params: {
  name: string;
  loginAt?: Date;
}) {
  const when = (params.loginAt ?? new Date()).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const text = `Hello ${params.name},

You just signed in to your ZTL account.

Time: ${when}

If this was you, no action is needed. If you did not sign in, reset your password immediately and contact support.

Regards,
ZTL`;

  const html = `
    <p>Hello ${params.name},</p>
    <p>You just signed in to your ZTL account.</p>
    <p><strong>Time:</strong> ${when}</p>
    <p>If this was you, no action is needed. If you did not sign in, reset your password immediately and contact support.</p>
    <p>Regards,<br>ZTL</p>
  `.trim();

  return {
    subject: "ZTL — new sign-in to your account",
    text,
    html,
  };
}

export async function sendLoginNoticeEmail(params: {
  to: string;
  name: string;
}) {
  const email = buildLoginNoticeEmail({ name: params.name });
  return sendEmail({
    channel: "welcome",
    to: params.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
