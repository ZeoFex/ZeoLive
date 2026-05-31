import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchStudentPortal } from "@/lib/student-portal";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: searchStudentPortal(q) });
}
