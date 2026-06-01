import { resetPasswordUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/transport";

export function buildPasswordResetEmail(params: {
  resetUrl: string;
}) {
  const subject = "Zeolive — Reset your password";
  const text = `You requested a password reset for your Zeolive account.

Click the link below to choose a new password. This link expires in 1 hour:

${params.resetUrl}

If you did not request this, you can ignore this email. Your password will not change.

Regards,
Zeolive`;

  const html = `
    <p>You requested a password reset for your Zeolive account.</p>
    <p><a href="${params.resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
    <p>Regards,<br>Zeolive</p>
  `.trim();

  return { subject, text, html };
}

export async function sendPasswordResetEmail(params: {
  to: string;
  rawToken: string;
}) {
  const resetUrl = resetPasswordUrl(params.rawToken);
  const email = buildPasswordResetEmail({ resetUrl });
  return sendEmail({
    to: params.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
