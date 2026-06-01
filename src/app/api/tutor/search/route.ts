import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchTutorPortal } from "@/lib/tutor-portal";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({
    results: await searchTutorPortal(q, session.user.id),
  });
}
