import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getConversationForUser,
  listMessagesForConversation,
  storeMessage,
} from "@/lib/messaging";

const sendSchema = z.object({
  body: z.string().min(1).max(8000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = await params;
  const conversation = await getConversationForUser(
    conversationId,
    session.user.id,
    session.user.role
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await listMessagesForConversation(conversationId);

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      studentId: conversation.studentId,
      tutorId: conversation.tutorId,
    },
    messages,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = await params;
  const conversation = await getConversationForUser(
    conversationId,
    session.user.id,
    session.user.role
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    const body = sendSchema.parse(await request.json());
    const message = await storeMessage({
      studentId: conversation.studentId,
      tutorId: conversation.tutorId,
      senderId: session.user.id,
      body: body.body,
      channel: "DIRECT",
    });

    return NextResponse.json({
      messageId: message.id,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not send message" }, { status: 400 });
  }
}
