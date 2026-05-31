export const TUTOR_EDUCATION_LEVELS = [
  {
    value: "UNDERGRADUATE_CONTINUING",
    label: "Undergraduate (continuing students)",
    description:
      "You are currently enrolled. A letter of recommendation from your institution is required.",
  },
  {
    value: "DIPLOMA_HND",
    label: "Diploma / HND",
    description: "Upload your diploma or HND certificate.",
  },
  {
    value: "GRADUATE",
    label: "Graduate",
    description: "Upload your degree certificate.",
  },
  {
    value: "POSTGRADUATE",
    label: "Postgraduate (Masters, PhD)",
    description: "Upload your postgraduate certificate.",
  },
] as const;

export type TutorEducationLevelValue =
  (typeof TUTOR_EDUCATION_LEVELS)[number]["value"];

export const SCHOOL_TYPES = [
  { value: "HOME_SCHOOL", label: "Home school student" },
  { value: "PUBLIC_SCHOOL", label: "Public school student" },
  { value: "PRIVATE_SCHOOL", label: "Private school student" },
] as const;

export type SchoolTypeValue = (typeof SCHOOL_TYPES)[number]["value"];

export const RECOMMENDER_TITLES = [
  { value: "DR", label: "Dr" },
  { value: "PROF", label: "Prof" },
] as const;

export const COUNTRIES = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "United States",
  "United Kingdom",
  "Canada",
  "Other",
] as const;

export function formatUserName(parts: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [parts.firstName, parts.middleName, parts.lastName]
    .filter(Boolean)
    .join(" ");
}

export function isTutorEducationQualified(
  level: TutorEducationLevelValue | null | undefined
) {
  return (
    level === "UNDERGRADUATE_CONTINUING" ||
    level === "DIPLOMA_HND" ||
    level === "GRADUATE" ||
    level === "POSTGRADUATE"
  );
}

export function tutorRequiresRecommendation(
  level: TutorEducationLevelValue | null | undefined
) {
  return level === "UNDERGRADUATE_CONTINUING";
}

export function tutorRequiresCertificate(
  level: TutorEducationLevelValue | null | undefined
) {
  return (
    level === "DIPLOMA_HND" ||
    level === "GRADUATE" ||
    level === "POSTGRADUATE"
  );
}
