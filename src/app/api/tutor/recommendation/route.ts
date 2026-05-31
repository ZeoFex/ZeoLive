import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { sendRecommendationEmail } from "@/lib/email/recommendation";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";
import { tutorRecommendationRequestSchema } from "@/lib/validations/registration";
import type { RecommenderTitle } from "@/generated/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = tutorRecommendationRequestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tutorProfile: true },
    });

    if (!user?.tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    if (user.tutorProfile.educationLevel !== "UNDERGRADUATE_CONTINUING") {
      return NextResponse.json(
        { error: "Recommendation is only required for continuing undergraduate tutors" },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const recommenderEmail = data.recommenderEmail.toLowerCase();

    const tutorFullName = buildDisplayName({
      firstName: user.firstName ?? "Tutor",
      middleName: user.middleName,
      lastName: user.lastName ?? "",
    });

    let emailResult: { submitUrl: string; devMode?: boolean };
    try {
      emailResult = await sendRecommendationEmail({
        title: data.title as RecommenderTitle,
        recommenderFirstName: data.recommenderFirstName,
        recommenderEmail,
        tutorFullName,
        tutorInstitutionName:
          user.tutorProfile.institutionName ?? "their institution",
        recommenderSchoolName: data.recommenderSchoolName,
        departmentName: data.departmentName,
        token,
        message: data.message,
      });
    } catch (mailError) {
      console.error("[recommendation] Email send failed:", mailError);
      const hint =
        process.env.NODE_ENV === "development" &&
        mailError instanceof Error &&
        mailError.message
          ? ` (${mailError.message})`
          : "";
      return NextResponse.json(
        {
          error: `Could not email your recommender. Check SMTP settings and try again.${hint}`,
        },
        { status: 503 }
      );
    }

    await prisma.tutorRecommendation.create({
      data: {
        tutorProfileId: user.tutorProfile.id,
        title: data.title as RecommenderTitle,
        recommenderFirstName: data.recommenderFirstName,
        recommenderLastName: data.recommenderLastName,
        departmentName: data.departmentName,
        recommenderSchoolName: data.recommenderSchoolName,
        recommenderEmail,
        recommenderPhone: data.recommenderPhone || null,
        message: data.message || null,
        token,
        emailSentAt: new Date(),
      },
    });

    await prisma.tutorProfile.update({
      where: { id: user.tutorProfile.id },
      data: {
        verificationStatus: "AWAITING_RECOMMENDATION",
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      success: true,
      submitUrl: emailResult.submitUrl,
      devMode: emailResult.devMode ?? false,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Recommendation request error:", error);
    return NextResponse.json(
      { error: "Could not send recommendation request" },
      { status: 500 }
    );
  }
}
