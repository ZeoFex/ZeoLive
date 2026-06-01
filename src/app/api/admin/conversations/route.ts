import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllConversationsForAdmin } from "@/lib/messaging";

/** List all student–tutor conversations (superadmin and subadmin). */
export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const search = new URL(request.url).searchParams.get("search")?.trim();
  try {
    const conversations = await listAllConversationsForAdmin(search || undefined);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Admin conversations list:", error);
    const message =
      error instanceof Error ? error.message : "Could not load conversations";
    return NextResponse.json({ error: message, conversations: [] }, { status: 500 });
  }
}
