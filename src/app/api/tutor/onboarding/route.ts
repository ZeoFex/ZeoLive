import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isTutorEducationQualified,
  tutorRequiresCertificate,
  tutorRequiresRecommendation,
} from "@/lib/constants/registration";
import { tutorOnboardingSchema } from "@/lib/validations/registration";
import type { TutorEducationLevel, TutorVerificationStatus } from "@/generated/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = tutorOnboardingSchema.parse(body);
    const level = data.educationLevel as TutorEducationLevel;

    if (!isTutorEducationQualified(level)) {
      await prisma.tutorProfile.update({
        where: { userId: session.user.id },
        data: {
          educationLevel: level,
          institutionName: data.institutionName,
          verificationStatus: "NOT_QUALIFIED",
          onboardingComplete: true,
        },
      });
      return NextResponse.json({
        success: true,
        notQualified: true,
        verificationStatus: "NOT_QUALIFIED",
      });
    }

    if (tutorRequiresCertificate(level) && !data.certificateUrl) {
      return NextResponse.json(
        { error: "Certificate is required for your education level" },
        { status: 400 }
      );
    }

    let verificationStatus: TutorVerificationStatus = "AWAITING_REVIEW";
    let onboardingComplete = true;

    if (tutorRequiresRecommendation(level)) {
      verificationStatus = "AWAITING_RECOMMENDATION";
      onboardingComplete = false;
    }

    await prisma.tutorProfile.update({
      where: { userId: session.user.id },
      data: {
        educationLevel: level,
        institutionName: data.institutionName,
        transcriptUrl: data.transcriptUrl,
        certificateUrl: data.certificateUrl ?? null,
        nationalIdUrl: data.nationalIdUrl,
        livePhotoUrl: data.livePhotoUrl,
        verificationStatus,
        onboardingComplete,
      },
    });

    return NextResponse.json({
      success: true,
      needsRecommendation: tutorRequiresRecommendation(level),
      verificationStatus,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Tutor onboarding error:", error);
    return NextResponse.json({ error: "Could not save verification" }, { status: 500 });
  }
}
