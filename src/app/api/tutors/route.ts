import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listApprovedTutors } from "@/lib/portal-data";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeZone = new URL(request.url).searchParams.get("timeZone") ?? "UTC";
  const tutors = await listApprovedTutors(timeZone);
  return NextResponse.json({ tutors });
}
