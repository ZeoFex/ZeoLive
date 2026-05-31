import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createLiveKitToken, isLiveKitConfigured } from "@/lib/livekit";

const schema = z.object({
  roomName: z.string().min(1),
  participantName: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: "LiveKit is not configured on the server" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { roomName, participantName } = schema.parse(body);

    const token = await createLiveKitToken(
      roomName,
      session.user.id,
      participantName ?? session.user.name ?? session.user.email ?? "Guest"
    );

    return NextResponse.json({
      token,
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
