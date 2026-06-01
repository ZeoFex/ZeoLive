import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getConversationByIdForAdmin,
  listMessagesForConversation,
} from "@/lib/messaging";
import {
  buildTranscriptJson,
  buildTranscriptText,
} from "@/lib/messaging-export";
import { displayUserName } from "@/lib/portal-data";
import type { ConversationSummary } from "@/lib/messaging";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { conversationId } = await params;
  const row = await getConversationByIdForAdmin(conversationId);

  if (!row) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const format =
    new URL(request.url).searchParams.get("format") === "json" ? "json" : "txt";

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

  const filenameBase = `zeolive-conversation-${conversationId.slice(0, 8)}`;

  if (format === "json") {
    const json = buildTranscriptJson(conversation, messages);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}.json"`,
      },
    });
  }

  const text = buildTranscriptText(conversation, messages);
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.txt"`,
    },
  });
}
