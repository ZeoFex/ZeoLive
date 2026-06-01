import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudentNotifications } from "@/lib/student-portal";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getStudentNotifications(session.user.id);
  return NextResponse.json({ items });
}
