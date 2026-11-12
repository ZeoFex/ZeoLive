import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";
import { moderateParticipant } from "@/lib/livekit-room-admin";

const schema = z.object({
  identity: z.string().min(1).max(120),
  action: z.enum(["mute", "unmute", "remove"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Only the host can do that" }, { status: 401 });
  }

  const { roomId } = await params;
  const access = await verifyClassroomAccess(roomId, session.user.id, session.user.role);
  if (!access.allowed || access.participantRole !== "tutor") {
    return NextResponse.json({ error: "Only the host can do that" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (parsed.data.identity === session.user.id) {
    return NextResponse.json({ error: "You cannot change your own place in the meeting" }, { status: 403 });
  }

  try {
    await moderateParticipant(roomId, parsed.data.identity, parsed.data.action);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update that person";
    const status = message.includes("no longer in the meeting") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
