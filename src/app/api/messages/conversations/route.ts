import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getOrCreateConversation,
  listConversationsForUser,
  pairHasTutoringRelationship,
  storeMessage,
} from "@/lib/messaging";

const sendSchema = z.object({
  tutorId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  body: z.string().max(8000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversations = await listConversationsForUser(
    session.user.id,
    session.user.role
  );

  return NextResponse.json({ conversations });
}

/** Start or continue a direct message thread. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = sendSchema.parse(await request.json());

    let studentId: string;
    let tutorId: string;

    if (session.user.role === "STUDENT") {
      if (!body.tutorId) {
        return NextResponse.json({ error: "tutorId is required" }, { status: 400 });
      }
      studentId = session.user.id;
      tutorId = body.tutorId;
    } else {
      if (!body.studentId) {
        return NextResponse.json(
          { error: "studentId is required" },
          { status: 400 }
        );
      }
      studentId = body.studentId;
      tutorId = session.user.id;
    }

    const allowed = await pairHasTutoringRelationship(studentId, tutorId);
    if (!allowed) {
      return NextResponse.json(
        { error: "You can only message tutors or students you have sessions with" },
        { status: 403 }
      );
    }

    const conversation = await getOrCreateConversation(studentId, tutorId);

    if (!body.body?.trim()) {
      return NextResponse.json({ conversationId: conversation.id });
    }

    const message = await storeMessage({
      studentId,
      tutorId,
      senderId: session.user.id,
      body: body.body,
      channel: "DIRECT",
    });

    return NextResponse.json({
      conversationId: conversation.id,
      messageId: message.id,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not send message";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
