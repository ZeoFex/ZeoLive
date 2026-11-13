import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";
import { isLiveKitConfigured } from "@/lib/livekit";
import { startServerRecording, stopServerRecording } from "@/lib/server-recording";

const schema = z.object({
  action: z.enum(["start", "stop"]),
  egressId: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLiveKitConfigured()) {
    return NextResponse.json({ mode: "browser" });
  }

  const { roomId } = await params;
  const access = await verifyClassroomAccess(roomId, session.user.id, session.user.role);
  if (!access.allowed || access.participantRole !== "tutor") {
    return NextResponse.json({ error: "Only the tutor can record this lesson" }, { status: 403 });
  }

  let data: z.infer<typeof schema>;
  try {
    data = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (data.action === "start") {
    try {
      const started = await startServerRecording(roomId);
      return NextResponse.json({ mode: "server", egressId: started.egressId });
    } catch (error) {
      console.error("Server recording start:", error);
      return NextResponse.json({ mode: "browser" });
    }
  }

  if (!data.egressId) {
    return NextResponse.json({ error: "Recording id is missing" }, { status: 400 });
  }
  try {
    const stopped = await stopServerRecording(data.egressId);
    return NextResponse.json({
      ok: true,
      saved: stopped.saved,
      pending: !stopped.saved,
    });
  } catch (error) {
    console.error("Server recording stop:", error);
    return NextResponse.json({ error: "Could not stop the recording" }, { status: 500 });
  }
}
