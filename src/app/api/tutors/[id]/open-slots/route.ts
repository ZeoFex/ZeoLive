import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { openSlotsForStudent } from "@/lib/booking-hours";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const timeZone = url.searchParams.get("timeZone") ?? "UTC";
  const result = await openSlotsForStudent({ tutorId: id, date, studentTimeZone: timeZone });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
