import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";

export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const reports = await prisma.sessionReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tutoringSession: {
          select: { id: true, title: true, subject: true, roomId: true, scheduledAt: true },
        },
      },
    });
    return NextResponse.json({
      reports: reports.map((report) => ({
        id: report.id,
        reporterName: report.reporterName,
        targetName: report.targetName,
        reason: report.reason,
        details: report.details ?? "",
        createdAt: report.createdAt.toISOString(),
        sessionTitle:
          report.tutoringSession.title?.trim() ||
          report.tutoringSession.subject?.trim() ||
          "Class",
        roomId: report.tutoringSession.roomId,
        scheduledAt: report.tutoringSession.scheduledAt.toISOString(),
      })),
    });
  } catch (error) {
    reportError("admin-class-reports", error);
    return NextResponse.json({ error: "Could not load class reports" }, { status: 500 });
  }
}
