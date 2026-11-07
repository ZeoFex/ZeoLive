import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { auth } from "@/auth";
import { MAX_TUTOR_SUBJECTS } from "@/lib/constants/programmes";
import { tutorRequiresRecommendation } from "@/lib/constants/registration";
import { prisma } from "@/lib/prisma";
import type { TutorVerificationStatus } from "@/generated/prisma";

const teachingSchema = z.object({
  programmeId: z.string().min(1, "Select your tertiary programme"),
  subjectIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one subject")
    .max(MAX_TUTOR_SUBJECTS, `Select at most ${MAX_TUTOR_SUBJECTS} subjects`),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = teachingSchema.parse(body);

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        educationLevel: true,
        transcriptUrl: true,
        nationalIdUrl: true,
        livePhotoUrl: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    if (!profile.educationLevel || !profile.transcriptUrl || !profile.nationalIdUrl || !profile.livePhotoUrl) {
      return NextResponse.json(
        { error: "Complete education verification before selecting subjects" },
        { status: 400 }
      );
    }

    const uniqueSubjectIds = [...new Set(data.subjectIds)];
    if (uniqueSubjectIds.length !== data.subjectIds.length) {
      return NextResponse.json(
        { error: "Duplicate subjects are not allowed" },
        { status: 400 }
      );
    }

    const programme = await prisma.programme.findFirst({
      where: { id: data.programmeId, active: true },
      include: {
        subjects: {
          where: {
            id: { in: uniqueSubjectIds },
            active: true,
          },
        },
      },
    });

    if (!programme) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    if (programme.subjects.length !== uniqueSubjectIds.length) {
      return NextResponse.json(
        { error: "Selected subjects must belong to the chosen programme" },
        { status: 400 }
      );
    }

    const subjectNames = programme.subjects
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((subject) => subject.name);

    const needsRecommendation = tutorRequiresRecommendation(profile.educationLevel);
    let verificationStatus: TutorVerificationStatus = "AWAITING_REVIEW";
    let onboardingComplete = true;

    if (needsRecommendation) {
      verificationStatus = "AWAITING_RECOMMENDATION";
      onboardingComplete = false;
    }

    await prisma.$transaction([
      prisma.tutorSubject.deleteMany({ where: { tutorProfileId: profile.id } }),
      prisma.tutorProfile.update({
        where: { id: profile.id },
        data: {
          programmeId: programme.id,
          subjects: subjectNames,
          verificationStatus,
          onboardingComplete,
        },
      }),
      prisma.tutorSubject.createMany({
        data: uniqueSubjectIds.map((subjectId) => ({
          tutorProfileId: profile.id,
          subjectId,
        })),
      }),
    ]);

    return NextResponse.json({
      success: true,
      needsRecommendation,
      verificationStatus,
      programme: { id: programme.id, name: programme.name },
      subjects: subjectNames,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Tutor teaching error:", error);
    return NextResponse.json(
      { error: "Could not save teaching subjects" },
      { status: 500 }
    );
  }
}
