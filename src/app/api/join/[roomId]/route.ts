import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Sign in to join this meeting" }, { status: 401 });
  }

  const { roomId } = await params;
  const tutoring = await prisma.tutoringSession.findUnique({
    where: { roomId },
    select: { id: true, tutorId: true, studentId: true, status: true },
  });

  if (!tutoring) {
    return NextResponse.json({ error: "This meeting link is not valid" }, { status: 404 });
  }
  if (tutoring.status === "CANCELLED" || tutoring.status === "COMPLETED") {
    return NextResponse.json({ error: "This meeting has ended" }, { status: 403 });
  }

  const isHost = session.user.id === tutoring.tutorId || session.user.role === "ADMIN";
  if (!isHost) {
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Sign in with a student account to join this meeting" },
        { status: 403 }
      );
    }
    await prisma.sessionParticipant.upsert({
      where: {
        tutoringSessionId_studentId: {
          tutoringSessionId: tutoring.id,
          studentId: session.user.id,
        },
      },
      create: {
        tutoringSessionId: tutoring.id,
        studentId: session.user.id,
      },
      update: {},
    });
    if (tutoring.studentId === tutoring.tutorId) {
      await prisma.tutoringSession.update({
        where: { id: tutoring.id },
        data: { studentId: session.user.id },
      });
    }
  }

  return NextResponse.json({ classroomPath: `/classroom/${roomId}` });
}
