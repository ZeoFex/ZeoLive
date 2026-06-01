import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  markSessionCompleted,
  participantDisplayName,
  verifyClassroomAccess,
} from "@/lib/classroom-access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const access = await verifyClassroomAccess(
    roomId,
    session.user.id,
    session.user.role
  );

  if (!access.allowed || !access.session) {
    return NextResponse.json(
      { error: access.error ?? "Access denied" },
      { status: access.status }
    );
  }

  const { session: tutoringSession, participantRole } = access;

  return NextResponse.json({
    roomId: tutoringSession.roomId,
    title: tutoringSession.title,
    subject: tutoringSession.subject,
    status: tutoringSession.status,
    scheduledAt: tutoringSession.scheduledAt.toISOString(),
    participantRole,
    participantName: participantDisplayName(
      participantRole === "tutor" ? tutoringSession.tutor : tutoringSession.student
    ),
    student: {
      id: tutoringSession.student.id,
      name: participantDisplayName(tutoringSession.student),
      image: tutoringSession.student.image,
    },
    tutor: {
      id: tutoringSession.tutor.id,
      name: participantDisplayName(tutoringSession.tutor),
      image: tutoringSession.tutor.image,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";

  const tutoringSession = await prisma.tutoringSession.findUnique({
    where: { roomId },
  });

  if (!tutoringSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isTutor =
    session.user.id === tutoringSession.tutorId ||
    session.user.role === "ADMIN";

  if (action === "end") {
    if (!isTutor) {
      return NextResponse.json(
        { error: "Only the tutor can end the session" },
        { status: 403 }
      );
    }
    await markSessionCompleted(roomId);
    return NextResponse.json({ status: "COMPLETED" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
