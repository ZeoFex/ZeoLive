import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markMaterialViewed } from "@/lib/study-materials";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shareId } = await params;
  const ok = await markMaterialViewed(shareId, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
