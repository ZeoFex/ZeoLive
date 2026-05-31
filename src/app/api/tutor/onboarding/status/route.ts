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
    },
  });

  return NextResponse.json({
    onboardingComplete: profile?.onboardingComplete ?? false,
    verificationStatus: profile?.verificationStatus ?? "PENDING",
    educationLevel: profile?.educationLevel ?? null,
  });
}
