import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const [totalUsers, activeTutors, pendingTutors, awaitingFinal, students, subAdmins] =
    await Promise.all([
      prisma.user.count(),
      prisma.tutorProfile.count({
        where: { verificationStatus: "APPROVED", verified: true },
      }),
      prisma.tutorProfile.count({
        where: {
          verificationStatus: {
            in: ["AWAITING_REVIEW", "AWAITING_RECOMMENDATION"],
          },
        },
      }),
      prisma.tutorProfile.count({
        where: { verificationStatus: "AWAITING_SUPERADMIN" },
      }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({
        where: { role: "ADMIN", adminTier: "SUBADMIN" },
      }),
    ]);

  return NextResponse.json({
    totalUsers,
    activeTutors,
    pendingTutors,
    awaitingFinal,
    students,
    subAdmins,
    revenue: 0,
    sessionsToday: 0,
  });
}
