import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteStoredMessage,
  getConversationByIdForAdmin,
  getConversationForUser,
} from "@/lib/messaging";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, messageId } = await params;

  if (session.user.role === "ADMIN") {
    const authResult = await requireAdmin();
    if ("error" in authResult) return authResult.error;

    const conversation = await getConversationByIdForAdmin(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else if (
    session.user.role === "STUDENT" ||
    session.user.role === "TUTOR"
  ) {
    const conversation = await getConversationForUser(
      conversationId,
      session.user.id,
      session.user.role
    );
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await deleteStoredMessage({
    conversationId,
    messageId,
    actorId: session.user.id,
    actorRole: session.user.role,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
