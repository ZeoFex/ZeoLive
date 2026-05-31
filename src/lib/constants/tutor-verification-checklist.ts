export const TUTOR_VERIFICATION_CHECKLIST = [
  {
    id: "identity_verified",
    label: "Identity documents match the applicant",
  },
  {
    id: "transcript_valid",
    label: "Transcript or certificate is authentic and meets requirements",
  },
  {
    id: "photo_matches",
    label: "Live photo matches the national ID",
  },
  {
    id: "recommendation_satisfactory",
    label: "Recommendation letter is satisfactory (if required)",
  },
  {
    id: "no_red_flags",
    label: "No red flags in the application materials",
  },
] as const;

export type TutorVerificationChecklistId =
  (typeof TUTOR_VERIFICATION_CHECKLIST)[number]["id"];

export const TUTOR_VERIFICATION_CHECKLIST_IDS = TUTOR_VERIFICATION_CHECKLIST.map(
  (item) => item.id
);

export function checklistLabel(id: string) {
  return TUTOR_VERIFICATION_CHECKLIST.find((item) => item.id === id)?.label ?? id;
}
