import { sendEmail } from "@/lib/email/transport";
import { adminVerificationUrl, loginUrl } from "@/lib/app-url";
import { checklistLabel } from "@/lib/constants/tutor-verification-checklist";

export function buildTutorAccountEmail(params: {
  tutorName: string;
  loginPageUrl?: string;
}) {
  const loginPage = params.loginPageUrl ?? loginUrl();

  const body = `Hello ${params.tutorName},

Thank you for registering on Zeolive as a tutor.

Your account has been created. Please log in using the link below to complete verification and upload your documents:

${loginPage}

If you did not create this account, you can ignore this email.

Regards,
Zeolive Admin`;

  return {
    subject: "Zeolive — Complete your tutor account verification",
    body,
  };
}

export async function sendTutorAccountEmail(params: {
  to: string;
  tutorName: string;
}) {
  const email = buildTutorAccountEmail({ tutorName: params.tutorName });
  return sendEmail({
    to: params.to,
    subject: email.subject,
    text: email.body,
  });
}

export function buildTutorDecisionEmail(params: {
  tutorName: string;
  approved: boolean;
  loginPageUrl?: string;
}) {
  const loginPage = params.loginPageUrl ?? loginUrl();

  if (params.approved) {
    const body = `Hello ${params.tutorName},

Your tutor application on Zeolive has been approved. You can now sign in and start teaching:

${loginPage}

Regards,
Zeolive Admin`;

    return { subject: "Zeolive — Your tutor application was approved", body };
  }

  const body = `Hello ${params.tutorName},

After reviewing your documents, we are unable to approve your tutor application on Zeolive at this time.

If you believe this was a mistake, contact support or re-apply with updated documents.

Regards,
Zeolive Admin`;

  return { subject: "Zeolive — Tutor application update", body };
}

export async function sendTutorDecisionEmail(params: {
  to: string;
  tutorName: string;
  approved: boolean;
}) {
  const email = buildTutorDecisionEmail({
    tutorName: params.tutorName,
    approved: params.approved,
  });
  return sendEmail({
    to: params.to,
    subject: email.subject,
    text: email.body,
  });
}

export function buildSuperadminRecommendationEmail(params: {
  tutorName: string;
  tutorEmail: string;
  reviewerName: string;
  checkedItems: string[];
  reviewPageUrl?: string;
}) {
  const reviewPage = params.reviewPageUrl ?? adminVerificationUrl("awaiting_final");
  const checklistLines = params.checkedItems
    .map((id) => `  • ${checklistLabel(id)}`)
    .join("\n");

  const body = `Hello,

A sub-admin has recommended a tutor for your final approval on Zeolive.

Tutor: ${params.tutorName} (${params.tutorEmail})
Reviewed by: ${params.reviewerName}
Sub-admin checklist (items they verified):
${checklistLines}

You are the final approver. The tutor cannot access their dashboard until you approve.

Review and give final approval:
${reviewPage}

Regards,
Zeolive`;

  return {
    subject: `Zeolive — Tutor ready for final approval: ${params.tutorName}`,
    body,
  };
}

export async function notifySuperadminsOfTutorRecommendation(params: {
  tutorName: string;
  tutorEmail: string;
  reviewerName: string;
  checkedItems: string[];
  superadminEmails: string[];
}) {
  if (params.superadminEmails.length === 0) return;

  const email = buildSuperadminRecommendationEmail({
    tutorName: params.tutorName,
    tutorEmail: params.tutorEmail,
    reviewerName: params.reviewerName,
    checkedItems: params.checkedItems,
  });

  await Promise.all(
    params.superadminEmails.map((to) =>
      sendEmail({ to, subject: email.subject, text: email.body })
    )
  );
}
