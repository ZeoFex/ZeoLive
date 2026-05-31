import type {
  AdminTier,
  Role,
  TutorEducationLevel,
  TutorVerificationStatus,
} from "@/generated/prisma";
import { buildDisplayName } from "@/lib/user-name";
import { TUTOR_EDUCATION_LEVELS } from "@/lib/constants/registration";

export function educationLevelLabel(level: TutorEducationLevel | null) {
  if (!level) return "—";
  return TUTOR_EDUCATION_LEVELS.find((e) => e.value === level)?.label ?? level;
}

export function userStatusLabel(params: {
  role: Role;
  verificationStatus?: TutorVerificationStatus | null;
}) {
  if (params.role === "TUTOR" && params.verificationStatus) {
    switch (params.verificationStatus) {
      case "APPROVED":
        return "active";
      case "REJECTED":
        return "rejected";
      case "NOT_QUALIFIED":
        return "not qualified";
      case "AWAITING_REVIEW":
      case "AWAITING_RECOMMENDATION":
      case "AWAITING_SUPERADMIN":
        return "pending";
      default:
        return "pending";
    }
  }
  return "active";
}

export function serializeUser(user: {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  role: Role;
  adminTier?: AdminTier | null;
  createdAt: Date;
  tutorProfile?: { verificationStatus: TutorVerificationStatus } | null;
}) {
  const name =
    user.name ??
    buildDisplayName({
      firstName: user.firstName ?? "",
      middleName: user.middleName,
      lastName: user.lastName ?? "",
    });

  const roleLabel =
    user.role === "ADMIN"
      ? user.adminTier === "SUPERADMIN"
        ? "superadmin"
        : user.adminTier === "SUBADMIN"
          ? "subadmin"
          : "admin"
      : user.role.toLowerCase();

  return {
    id: user.id,
    name,
    email: user.email,
    role: roleLabel,
    adminTier: user.adminTier ?? null,
    status: userStatusLabel({
      role: user.role,
      verificationStatus: user.tutorProfile?.verificationStatus,
    }),
    joinedAt: user.createdAt.toISOString(),
  };
}

export function serializeTutorVerification(profile: {
  id: string;
  educationLevel: TutorEducationLevel | null;
  institutionName: string | null;
  transcriptUrl: string | null;
  certificateUrl: string | null;
  nationalIdUrl: string | null;
  livePhotoUrl: string | null;
  verificationStatus: TutorVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    regionState: string | null;
  };
  recommendations: {
    id: string;
    title: string;
    recommenderFirstName: string;
    recommenderLastName: string;
    recommenderEmail: string;
    departmentName: string;
    recommenderSchoolName: string;
    submittedAt: Date | null;
    letterText: string | null;
    letterUrl: string | null;
  }[];
  subadminReviews?: {
    id: string;
    reviewerId: string;
    reviewerName: string;
    checkedItems: string[];
    createdAt: Date;
  }[];
}) {
  const name =
    profile.user.name ??
    buildDisplayName({
      firstName: profile.user.firstName ?? "",
      middleName: profile.user.middleName,
      lastName: profile.user.lastName ?? "",
    });

  return {
    id: profile.id,
    userId: profile.user.id,
    name,
    email: profile.user.email,
    phone: profile.user.phone,
    country: profile.user.country,
    regionState: profile.user.regionState,
    educationLevel: profile.educationLevel,
    educationLevelLabel: educationLevelLabel(profile.educationLevel),
    institutionName: profile.institutionName,
    transcriptUrl: profile.transcriptUrl,
    certificateUrl: profile.certificateUrl,
    nationalIdUrl: profile.nationalIdUrl,
    livePhotoUrl: profile.livePhotoUrl,
    status: profile.verificationStatus,
    submittedAt: profile.updatedAt.toISOString(),
    recommendations: profile.recommendations.map((r) => ({
      id: r.id,
      title: r.title,
      name: `${r.recommenderFirstName} ${r.recommenderLastName}`,
      email: r.recommenderEmail,
      departmentName: r.departmentName,
      recommenderSchoolName: r.recommenderSchoolName,
      submitted: !!r.submittedAt,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      letterText: r.letterText,
      letterUrl: r.letterUrl,
    })),
    subadminReviews: (profile.subadminReviews ?? []).map((review) => ({
      id: review.id,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewerName,
      checkedItems: review.checkedItems,
      createdAt: review.createdAt.toISOString(),
    })),
    subadminReviewCount: profile.subadminReviews?.length ?? 0,
  };
}
