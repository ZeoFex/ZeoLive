import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingComplete: true,
      verificationStatus: true,
      educationLevel: true,
      institutionName: true,
      programmeId: true,
      transcriptUrl: true,
      certificateUrl: true,
      nationalIdUrl: true,
      livePhotoUrl: true,
      subjects: true,
      tutorSubjects: {
        select: { subjectId: true },
      },
      user: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
        },
      },
    },
  });

  const hasDocuments = Boolean(
    profile?.transcriptUrl && profile?.nationalIdUrl && profile?.livePhotoUrl
  );
  const subjectIds =
    profile?.tutorSubjects?.map((row) => row.subjectId) ?? [];
  const hasTeaching = Boolean(
    profile?.programmeId &&
      ((profile?.subjects?.length ?? 0) > 0 || subjectIds.length > 0)
  );

  const fullName = [
    profile?.user?.firstName,
    profile?.user?.middleName,
    profile?.user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return NextResponse.json({
    onboardingComplete: profile?.onboardingComplete ?? false,
    verificationStatus: profile?.verificationStatus ?? "PENDING",
    educationLevel: profile?.educationLevel ?? null,
    institutionName: profile?.institutionName ?? "",
    programmeId: profile?.programmeId ?? "",
    subjectIds,
    transcriptUrl: profile?.transcriptUrl ?? "",
    certificateUrl: profile?.certificateUrl ?? "",
    nationalIdUrl: profile?.nationalIdUrl ?? "",
    livePhotoUrl: profile?.livePhotoUrl ?? "",
    hasDocuments,
    hasTeaching,
    tutorFullName: fullName,
  });
}
