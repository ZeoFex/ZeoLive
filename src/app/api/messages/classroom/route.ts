import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";
import { storeMessage } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  roomId: z.string().min(1),
  body: z.string().min(1).max(8000),
  clientMessageId: z.string().min(1).max(128).optional(),
});

/** Persist a live classroom chat line for admin evidence retention. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.user.role !== "STUDENT" &&
    session.user.role !== "TUTOR" &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = schema.parse(await request.json());

    const access = await verifyClassroomAccess(
      data.roomId,
      session.user.id,
      session.user.role
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const tutoringSession = await prisma.tutoringSession.findUnique({
      where: { roomId: data.roomId },
      select: { id: true, studentId: true, tutorId: true },
    });

    if (!tutoringSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const message = await storeMessage({
      studentId: tutoringSession.studentId,
      tutorId: tutoringSession.tutorId,
      senderId: session.user.id,
      body: data.body,
      channel: "CLASSROOM",
      tutoringSessionId: tutoringSession.id,
      clientMessageId: data.clientMessageId ?? null,
    });

    return NextResponse.json({
      messageId: message.id,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Classroom message persist error:", error);
    return NextResponse.json({ error: "Could not save message" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomId = new URL(request.url).searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const access = await verifyClassroomAccess(
    roomId,
    session.user.id,
    session.user.role
  );
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const tutoringSession = await prisma.tutoringSession.findUnique({
    where: { roomId },
    select: { id: true, studentId: true, tutorId: true },
  });

  if (!tutoringSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const conversation = await prisma.tutorStudentConversation.findUnique({
    where: {
      studentId_tutorId: {
        studentId: tutoringSession.studentId,
        tutorId: tutoringSession.tutorId,
      },
    },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ messages: [] });
  }

  const { listMessagesForConversation } = await import("@/lib/messaging");
  const all = await listMessagesForConversation(conversation.id);
  const messages = all.filter((m) => m.tutoringSessionId === tutoringSession.id);

  return NextResponse.json({ messages });
}
