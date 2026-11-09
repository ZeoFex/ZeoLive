import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listStudentLectures } from "@/lib/lectures";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await listStudentLectures(session.user.id);
  return NextResponse.json({ videos }, { headers: { "Cache-Control": "no-store" } });
}
