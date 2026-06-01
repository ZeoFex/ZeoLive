import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listApprovedTutors } from "@/lib/portal-data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tutors = await listApprovedTutors();
  return NextResponse.json({ tutors });
}
