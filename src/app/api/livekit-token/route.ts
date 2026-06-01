import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  markSessionActive,
  participantDisplayName,
  verifyClassroomAccess,
} from "@/lib/classroom-access";
import {
  createLiveKitToken,
  getLiveKitServerUrl,
  isLiveKitConfigured,
} from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1).optional(),
  role: z.enum(["student", "tutor"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
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
    const { room, identity, role } = schema.parse(body);

    if (identity && identity !== session.user.id) {
      return NextResponse.json({ error: "Identity mismatch" }, { status: 403 });
    }

    const access = await verifyClassroomAccess(
      room,
      session.user.id,
      session.user.role
    );

    if (!access.allowed || !access.session || !access.participantRole) {
      return NextResponse.json(
        { error: access.error ?? "Access denied" },
        { status: access.status }
      );
    }

    if (access.participantRole !== role) {
      return NextResponse.json(
        { error: "Role does not match your session assignment" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = await createLiveKitToken(
      room,
      session.user.id,
      participantDisplayName(user),
      role
    );

    await markSessionActive(room);

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
