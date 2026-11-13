import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { displayUserName } from "@/lib/portal-data";
import {
  applyTutorParticipantLimit,
  MAX_PARTICIPANT_LIMIT,
} from "@/lib/participant-limit";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set"),
    tutorId: z.string().min(1),
    participantLimit: z.number().int().min(1).max(MAX_PARTICIPANT_LIMIT),
  }),
  z.object({
    action: z.literal("approve"),
    requestId: z.string().min(1),
  }),
  z.object({
    action: z.literal("decline"),
    requestId: z.string().min(1),
  }),
]);

export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const [tutors, requests] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TUTOR" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        tutorProfile: { select: { participantLimit: true } },
      },
    }),
    prisma.participantLimitRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        tutor: { select: { id: true, email: true, name: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return NextResponse.json({
    tutors: tutors.map((tutor) => ({
      id: tutor.id,
      name: displayUserName(tutor),
      email: tutor.email,
      participantLimit: tutor.tutorProfile?.participantLimit ?? 50,
    })),
    requests: requests.map((row) => ({
      id: row.id,
      tutorId: row.tutorId,
      tutorName: displayUserName(row.tutor),
      requestedLimit: row.requestedLimit,
      note: row.note ?? "",
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const data = patchSchema.parse(await request.json());
    if (data.action === "set") {
      const tutor = await prisma.user.findFirst({
        where: { id: data.tutorId, role: "TUTOR" },
        select: { id: true },
      });
      if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
      await applyTutorParticipantLimit(tutor.id, data.participantLimit);
      return NextResponse.json({ ok: true });
    }

    const row = await prisma.participantLimitRequest.findUnique({
      where: { id: data.requestId },
    });
    if (!row || row.status !== "PENDING") {
      return NextResponse.json({ error: "That request is no longer open" }, { status: 404 });
    }
    if (data.action === "approve") {
      await applyTutorParticipantLimit(row.tutorId, row.requestedLimit);
    }
    await prisma.participantLimitRequest.update({
      where: { id: row.id },
      data: { status: data.action === "approve" ? "APPROVED" : "DECLINED", reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a class size from 1 to 500" }, { status: 400 });
    }
    reportError("class-size", error);
    return NextResponse.json({ error: "Could not update the class size" }, { status: 500 });
  }
}
