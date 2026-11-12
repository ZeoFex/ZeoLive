import { NextResponse } from "next/server";
import { z } from "zod";
import { markSessionActive } from "@/lib/classroom-access";
import { notifyBookedStudentsSessionStarted } from "@/lib/session-started";
import { resolveClassroomActor } from "@/lib/classroom-connection";
import {
  createLiveKitToken,
  getLiveKitServerUrl,
  isLiveKitConfigured,
} from "@/lib/livekit";

/** Legacy path — same behaviour as POST /api/livekit-token */
const schema = z.object({
  roomName: z.string().min(1).optional(),
  room: z.string().min(1).optional(),
  participantName: z.string().min(1).optional(),
  role: z.enum(["student", "tutor"]).optional(),
});

export async function POST(request: Request) {
  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: "LiveKit is not configured on the server" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const room = parsed.room ?? parsed.roomName;
    if (!room) {
      return NextResponse.json({ error: "room is required" }, { status: 400 });
    }

    const resolved = await resolveClassroomActor(room, request);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const role = parsed.role ?? resolved.actor.role;
    if (resolved.actor.role !== role) {
      return NextResponse.json(
        { error: "Role does not match your session assignment" },
        { status: 403 }
      );
    }

    const token = await createLiveKitToken(
      room,
      resolved.actor.identity,
      resolved.actor.name,
      role
    );

    if (role === "tutor") {
      const started = await markSessionActive(room);
      if (started) {
        await notifyBookedStudentsSessionStarted(room).catch((error) => {
          console.error("Session start notification failed:", error);
        });
      }
    }

    return NextResponse.json({
      token,
      serverUrl: getLiveKitServerUrl(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
