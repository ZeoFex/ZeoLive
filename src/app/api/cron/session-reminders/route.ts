import { NextResponse } from "next/server";
import { sendDueSessionReminders } from "@/lib/session-reminders";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueSessionReminders();
  return NextResponse.json(result);
}
