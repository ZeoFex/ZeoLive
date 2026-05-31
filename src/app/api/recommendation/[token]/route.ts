import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";
import { recommenderSubmissionSchema } from "@/lib/validations/registration";

function titleLabel(title: string) {
  return title === "DR" ? "Dr" : "Prof";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const record = await prisma.tutorRecommendation.findUnique({
    where: { token },
    include: {
      tutorProfile: {
        include: {
          user: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  const tutorName =
    record.tutorProfile.user.name ??
    buildDisplayName({
      firstName: record.tutorProfile.user.firstName ?? "",
      middleName: record.tutorProfile.user.middleName,
      lastName: record.tutorProfile.user.lastName ?? "",
    });

  return NextResponse.json({
    submitted: !!record.submittedAt,
    tutorName,
    institutionName: record.tutorProfile.institutionName,
    departmentName: record.departmentName,
    recommenderSchoolName: record.recommenderSchoolName,
    tutorInstitutionName: record.tutorProfile.institutionName,
    message: record.message,
    recommenderName: `${titleLabel(record.title)} ${record.recommenderFirstName} ${record.recommenderLastName}`,
    recommenderEmail: record.recommenderEmail,
    letterText: record.submittedAt ? record.letterText : null,
    letterUrl: record.submittedAt ? record.letterUrl : null,
    submittedAt: record.submittedAt?.toISOString() ?? null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = await request.json();
    const data = recommenderSubmissionSchema.parse(body);

    const record = await prisma.tutorRecommendation.findUnique({
      where: { token },
      include: { tutorProfile: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (record.submittedAt) {
      return NextResponse.json(
        { error: "Recommendation already submitted" },
        { status: 409 }
      );
    }

    const letterText = data.letterText?.trim() || null;
    const letterUrl = data.letterUrl?.trim() || null;

    await prisma.$transaction([
      prisma.tutorRecommendation.update({
        where: { id: record.id },
        data: {
          letterText,
          letterUrl,
          submittedAt: new Date(),
        },
      }),
      prisma.tutorProfile.update({
        where: { id: record.tutorProfileId },
        data: { verificationStatus: "AWAITING_REVIEW" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Recommendation submit error:", error);
    return NextResponse.json({ error: "Could not submit recommendation" }, { status: 500 });
  }
}
