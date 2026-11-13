import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { refreshTutorRating } from "@/lib/record-attendance";
import { reportError } from "@/lib/report-error";
import { canLeaveReview } from "@/lib/session-trust";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = reviewSchema.parse(await request.json());
    const { sessionId } = await params;
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: { select: { studentId: true } },
        attendance: { select: { userId: true } },
      },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const userId = authSession.user.id;
    const allowed = canLeaveReview({
      status: session.status,
      viewerId: userId,
      viewerRole: authSession.user.role ?? "",
      tutorId: session.tutorId,
      studentId: session.studentId,
      participantIds: session.participants.map((participant) => participant.studentId),
      attended: session.attendance.some((row) => row.userId === userId),
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "You can rate this tutor after you attend the completed class" },
        { status: 403 }
      );
    }

    const comment = data.comment?.trim() || null;
    await prisma.sessionReview.upsert({
      where: { tutoringSessionId_studentId: { tutoringSessionId: session.id, studentId: userId } },
      create: {
        tutoringSessionId: session.id,
        studentId: userId,
        tutorId: session.tutorId,
        rating: data.rating,
        comment,
      },
      update: { rating: data.rating, comment },
    });
    await refreshTutorRating(session.tutorId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a rating from 1 to 5" }, { status: 400 });
    }
    reportError("session-review", error);
    return NextResponse.json({ error: "Could not save your rating" }, { status: 500 });
  }
}
