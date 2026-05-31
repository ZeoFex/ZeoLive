import type { RecommenderTitle } from "@/generated/prisma";
import { recommendationSubmitUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/transport";

function titleLabel(title: RecommenderTitle) {
  return title === "DR" ? "Dr" : "Prof";
}

export function buildRecommendationEmail(params: {
  title: RecommenderTitle;
  recommenderFirstName: string;
  tutorFullName: string;
  tutorInstitutionName: string;
  recommenderSchoolName: string;
  departmentName: string;
  submitUrl: string;
  message?: string | null;
}) {
  const salutation = `${titleLabel(params.title)} ${params.recommenderFirstName}`;

  const text = `Hello ${salutation},

On behalf of ${params.tutorFullName}, ZoeLive is requesting a recommendation to verify this individual as a student of ${params.tutorInstitutionName} who applied to teach on ZoeLive.

You are listed as faculty at ${params.recommenderSchoolName}, ${params.departmentName}.

Click the link below to submit your letter of recommendation:
${params.submitUrl}
${params.message ? `\n${params.message}\n` : ""}
Regards,
ZoeLive Admin`;

  const html = `
    <p>Hello ${salutation},</p>
    <p>On behalf of <strong>${params.tutorFullName}</strong>, ZoeLive is requesting a recommendation to verify this individual as a student of <strong>${params.tutorInstitutionName}</strong> who applied to teach on ZoeLive.</p>
    <p>You are listed as faculty at <strong>${params.recommenderSchoolName}</strong>, ${params.departmentName}.</p>
    <p><a href="${params.submitUrl}">Submit your letter of recommendation</a></p>
    ${params.message ? `<p>${params.message.replace(/\n/g, "<br>")}</p>` : ""}
    <p>Regards,<br>ZoeLive Admin</p>
  `.trim();

  return {
    subject: `ZoeLive — Recommendation request for ${params.tutorFullName}`,
    text,
    html,
  };
}

export async function sendRecommendationEmail(params: {
  title: RecommenderTitle;
  recommenderFirstName: string;
  recommenderEmail: string;
  tutorFullName: string;
  tutorInstitutionName: string;
  recommenderSchoolName: string;
  departmentName: string;
  token: string;
  message?: string | null;
}) {
  const submitUrl = recommendationSubmitUrl(params.token);
  const email = buildRecommendationEmail({
    title: params.title,
    recommenderFirstName: params.recommenderFirstName,
    tutorFullName: params.tutorFullName,
    tutorInstitutionName: params.tutorInstitutionName,
    recommenderSchoolName: params.recommenderSchoolName,
    departmentName: params.departmentName,
    submitUrl,
    message: params.message,
  });

  const result = await sendEmail({
    to: params.recommenderEmail.toLowerCase(),
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[dev] Recommendation link for ${params.recommenderEmail}: ${submitUrl}`
    );
  }

  return { ...result, submitUrl };
}
