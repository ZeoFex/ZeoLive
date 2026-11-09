import type { RecommenderFormValues } from "@/components/auth/recommender-request-fields";
import type { TutorEducationLevelValue } from "@/lib/constants/registration";

export type TutorWizardStep =
  | "account"
  | "documents"
  | "teaching"
  | "recommendation"
  | "complete"
  | "not-qualified";

export interface TutorSignupAccountDraft {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  regionState?: string;
}

export interface TutorSignupDraft {
  version: 1;
  updatedAt: string;
  step: TutorWizardStep;
  /** Furthest step unlocked — user may revisit any step up to this. */
  unlockedStep: TutorWizardStep;
  /** True only after the tutor account was created successfully. */
  accountCreated: boolean;
  country: string;
  acceptTerms: boolean;
  account: TutorSignupAccountDraft;
  educationLevel: TutorEducationLevelValue | "";
  institutionName: string;
  transcriptUrl: string;
  certificateUrl: string;
  nationalIdUrl: string;
  livePhotoUrl: string;
  programmeId: string;
  subjectIds: string[];
  recommender: RecommenderFormValues;
  tutorFullName: string;
}

const STEP_ORDER: TutorWizardStep[] = [
  "account",
  "documents",
  "teaching",
  "recommendation",
  "complete",
];

export function stepRank(step: TutorWizardStep): number {
  const index = STEP_ORDER.indexOf(step);
  return index === -1 ? 0 : index;
}

export function maxStep(
  a: TutorWizardStep,
  b: TutorWizardStep
): TutorWizardStep {
  return stepRank(a) >= stepRank(b) ? a : b;
}

export const TUTOR_SIGNUP_DRAFT_KEY = "ztl-tutor-signup-draft-v1";

const defaultRecommender = (): RecommenderFormValues => ({
  title: "DR",
  recommenderFirstName: "",
  recommenderLastName: "",
  recommenderSchoolName: "",
  departmentName: "",
  recommenderEmail: "",
  recommenderPhone: "",
  message: "",
});

export function emptyTutorSignupDraft(
  overrides: Partial<TutorSignupDraft> = {}
): TutorSignupDraft {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    step: "account",
    unlockedStep: "account",
    accountCreated: false,
    country: "",
    acceptTerms: false,
    account: {},
    educationLevel: "",
    institutionName: "",
    transcriptUrl: "",
    certificateUrl: "",
    nationalIdUrl: "",
    livePhotoUrl: "",
    programmeId: "",
    subjectIds: [],
    recommender: defaultRecommender(),
    tutorFullName: "",
    ...overrides,
  };
}

export function readTutorSignupDraft(): TutorSignupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TUTOR_SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TutorSignupDraft;
    if (parsed?.version !== 1 || typeof parsed.step !== "string") return null;
    return {
      ...emptyTutorSignupDraft(),
      ...parsed,
      account: { ...emptyTutorSignupDraft().account, ...parsed.account },
      recommender: {
        ...defaultRecommender(),
        ...parsed.recommender,
      },
      subjectIds: Array.isArray(parsed.subjectIds) ? parsed.subjectIds : [],
    };
  } catch {
    return null;
  }
}

export function writeTutorSignupDraft(draft: TutorSignupDraft) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      TUTOR_SIGNUP_DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString(), version: 1 })
    );
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function clearTutorSignupDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TUTOR_SIGNUP_DRAFT_KEY);
  } catch {
    // Ignore.
  }
}

export function resolveResumeStep(status: {
  onboardingComplete?: boolean;
  verificationStatus?: string;
  hasDocuments?: boolean;
  hasTeaching?: boolean;
  educationLevel?: string | null;
}): TutorWizardStep | null {
  if (status.onboardingComplete || status.verificationStatus === "APPROVED") {
    return "complete";
  }
  if (status.verificationStatus === "AWAITING_RECOMMENDATION") {
    return "recommendation";
  }
  if (status.hasTeaching) {
    return "complete";
  }
  if (status.hasDocuments) {
    return "teaching";
  }
  if (status.verificationStatus === "PENDING") {
    return "documents";
  }
  return "documents";
}
