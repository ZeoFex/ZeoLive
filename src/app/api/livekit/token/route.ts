import { NextResponse } from "next/server";
import { z } from "zod";
import { issueClassroomToken } from "@/lib/livekit-access";

/** Legacy path. Same token rules as POST /api/livekit-token. */
const schema = z.object({
  roomName: z.string().min(1).optional(),
  room: z.string().min(1).optional(),
  participantName: z.string().min(1).optional(),
  role: z.enum(["student", "tutor"]).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.parse(await request.json());
    const room = parsed.room ?? parsed.roomName;
    if (!room) {
      return NextResponse.json({ error: "room is required" }, { status: 400 });
    }
    const issued = await issueClassroomToken(request, room, parsed.role);
    if ("error" in issued) {
      return NextResponse.json({ error: issued.error }, { status: issued.status });
    }
    return NextResponse.json(issued);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
