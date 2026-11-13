import { NextResponse } from "next/server";
import { z } from "zod";
import { issueClassroomToken } from "@/lib/livekit-access";

const schema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1).optional(),
  role: z.enum(["student", "tutor"]),
});

export async function POST(request: Request) {
  try {
    const { room, role } = schema.parse(await request.json());
    const issued = await issueClassroomToken(request, room, role);
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
