import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getConversationByIdForAdmin,
  listMessagesForConversation,
} from "@/lib/messaging";
import { displayUserName } from "@/lib/portal-data";
import type { ConversationSummary } from "@/lib/messaging";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { conversationId } = await params;
  const row = await getConversationByIdForAdmin(conversationId);

  if (!row) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const conversation: ConversationSummary = {
    id: row.id,
    student: {
      id: row.student.id,
      email: row.student.email,
      role: row.student.role,
      name: displayUserName(row.student),
    },
    tutor: {
      id: row.tutor.id,
      email: row.tutor.email,
      role: row.tutor.role,
      name: displayUserName(row.tutor),
    },
    lastMessage: null,
    lastMessageAt: null,
    messageCount: 0,
    updatedAt: row.updatedAt.toISOString(),
  };

  const messages = await listMessagesForConversation(conversationId);
  conversation.messageCount = messages.length;
  if (messages.length > 0) {
    const last = messages[messages.length - 1];
    conversation.lastMessage = last.body;
    conversation.lastMessageAt = last.createdAt;
  }

  return NextResponse.json({ conversation, messages });
}
