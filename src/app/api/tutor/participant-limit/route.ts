import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email/transport";
import { MAX_PARTICIPANT_LIMIT, tutorParticipantLimit } from "@/lib/participant-limit";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";

const requestSchema = z.object({
  requestedLimit: z.number().int().min(1).max(MAX_PARTICIPANT_LIMIT),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = await tutorParticipantLimit(session.user.id);
  const pending = await prisma.participantLimitRequest.findFirst({
    where: { tutorId: session.user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { requestedLimit: true, note: true },
  });
  return NextResponse.json({
    limit,
    pending: pending
      ? { requestedLimit: pending.requestedLimit, note: pending.note ?? "" }
      : null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = requestSchema.parse(await request.json());
    const current = await tutorParticipantLimit(session.user.id);
    if (data.requestedLimit <= current) {
      return NextResponse.json(
        { error: `Ask for more than your current limit of ${current}` },
        { status: 400 }
      );
    }
    const note = data.note?.trim() || null;
    const existing = await prisma.participantLimitRequest.findFirst({
      where: { tutorId: session.user.id, status: "PENDING" },
      select: { id: true },
    });
    if (existing) {
      await prisma.participantLimitRequest.update({
        where: { id: existing.id },
        data: { requestedLimit: data.requestedLimit, note },
      });
    } else {
      await prisma.participantLimitRequest.create({
        data: {
          tutorId: session.user.id,
          requestedLimit: data.requestedLimit,
          note,
        },
      });
    }

    const tutor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    await Promise.all(
      admins.map((admin) =>
        sendEmail({
          channel: "support",
          to: admin.email,
          subject: "ZTL — class size request",
          text: `${tutor?.name ?? tutor?.email ?? "A tutor"} asked to raise their class size from ${current} to ${data.requestedLimit}.\n${note ?? ""}`,
        }).catch((error) => reportError("participant-limit-email", error))
      )
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a class size up to 500" }, { status: 400 });
    }
    reportError("participant-limit-request", error);
    return NextResponse.json({ error: "Could not send the request" }, { status: 500 });
  }
}
