import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteLectureVideo } from "@/lib/lectures";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await deleteLectureVideo(session.user.id, id);
  if (!removed) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
