import { resetPasswordUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/transport";

export function buildPasswordResetEmail(params: {
  resetUrl: string;
}) {
  const subject = "ZTL — Reset your password";
  const text = `You requested a password reset for your ZTL account.

Click the link below to choose a new password. This link expires in 1 hour:

${params.resetUrl}

If you did not request this, you can ignore this email. Your password will not change.

Regards,
ZTL`;

  const html = `
    <p>You requested a password reset for your ZTL account.</p>
    <p><a href="${params.resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
    <p>Regards,<br>ZTL</p>
  `.trim();

  return { subject, text, html };
}

export async function sendPasswordResetEmail(params: {
  to: string;
  rawToken: string;
  baseUrl?: string;
}) {
  const resetUrl = resetPasswordUrl(params.rawToken, params.baseUrl);
  const email = buildPasswordResetEmail({ resetUrl });
  return sendEmail({
    channel: "support",
    to: params.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
