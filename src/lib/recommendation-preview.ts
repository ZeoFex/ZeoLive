import type { RecommenderFormValues } from "@/components/auth/recommender-request-fields";

function titleLabel(title: "DR" | "PROF") {
  return title === "DR" ? "Dr" : "Prof";
}

export function buildRecommendationEmailPreview(params: {
  recommender: RecommenderFormValues;
  tutorFullName: string;
  tutorInstitutionName: string;
}) {
  const { recommender, tutorFullName, tutorInstitutionName } = params;
  const name = titleLabel(recommender.title);

  return `Hello ${name} ${recommender.recommenderFirstName || "[First name]"},

On behalf of ${tutorFullName}, Zeolive is requesting a recommendation to verify this individual as a student of ${tutorInstitutionName} who applied to teach on Zeolive.

You are listed as faculty at ${recommender.recommenderSchoolName || "[School / institution]"}, ${recommender.departmentName || "[Department]"}.

Click on the [link] to submit the letter of recommendation.
${recommender.message ? `\n${recommender.message}\n` : ""}
Regards,
Zeolive Admin`;
}
