import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveClassroomActor } from "@/lib/classroom-connection";
import { sendEmail } from "@/lib/email/transport";
import { linkedAccountUserId } from "@/lib/record-attendance";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";
import { attendanceKey, REPORT_REASONS } from "@/lib/session-trust";

const reportSchema = z.object({
  targetName: z.string().trim().min(1).max(80),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const resolved = await resolveClassroomActor(roomId, request);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const data = reportSchema.parse(await request.json());
    const actor = resolved.actor;
    const linkedUserId = await linkedAccountUserId(actor);
    const reporterKey = linkedUserId ?? attendanceKey(actor.identity, actor.guest);
    const details = data.details?.trim() || null;

    const existing = await prisma.sessionReport.findUnique({
      where: {
        tutoringSessionId_reporterKey_targetName: {
          tutoringSessionId: actor.session.id,
          reporterKey,
          targetName: data.targetName,
        },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, already: true });
    }

    await prisma.sessionReport.create({
      data: {
        tutoringSessionId: actor.session.id,
        reporterKey,
        reporterUserId: linkedUserId,
        reporterName: actor.name,
        targetName: data.targetName,
        reason: data.reason,
        details,
      },
    });

    const title = actor.session.title?.trim() || actor.session.subject?.trim() || "Class";
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, name: true },
    });
    await Promise.all(
      admins.map((admin) =>
        sendEmail({
          channel: "support",
          to: admin.email,
          subject: `ZTL — Class report: ${data.reason}`,
          text: `${actor.name} reported ${data.targetName} in ${title}.\nReason: ${data.reason}\n${details ?? ""}`,
        }).catch((error) => reportError("session-report-email", error))
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose who and why you are reporting" }, { status: 400 });
    }
    reportError("session-report", error);
    return NextResponse.json({ error: "Could not send the report" }, { status: 500 });
  }
}
