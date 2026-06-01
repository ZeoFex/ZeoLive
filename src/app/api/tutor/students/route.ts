import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listTutorStudents } from "@/lib/portal-data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await listTutorStudents(session.user.id);
  return NextResponse.json({ students });
}
