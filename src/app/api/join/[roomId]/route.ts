import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  cleanDisplayName,
  createMeetingGuest,
  MEETING_GUEST_COOKIE,
  meetingGuestCookieOptions,
  sealMeetingGuest,
} from "@/lib/meeting-guest";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const tutoring = await prisma.tutoringSession.findUnique({
    where: { roomId },
    select: { id: true, tutorId: true, status: true },
  });

  if (!tutoring) {
    return NextResponse.json({ error: "This meeting link is not valid" }, { status: 404 });
  }
  if (tutoring.status === "CANCELLED" || tutoring.status === "COMPLETED") {
    return NextResponse.json({ error: "This meeting has ended" }, { status: 403 });
  }

  const session = await auth();
  const isHost =
    !!session?.user?.id &&
    (session.user.id === tutoring.tutorId || session.user.role === "ADMIN");
  if (isHost) {
    return NextResponse.json({ classroomPath: `/classroom/${roomId}` });
  }

  const body = await request.json().catch(() => null);
  const name = cleanDisplayName(
    body && typeof body === "object" && "displayName" in body
      ? (body as { displayName?: unknown }).displayName
      : null
  );
  if (!name) {
    return NextResponse.json(
      { error: "Enter the name you want people to see. Use 2 to 40 characters." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ classroomPath: `/classroom/${roomId}` });
  response.cookies.set(
    MEETING_GUEST_COOKIE,
    sealMeetingGuest(createMeetingGuest(roomId, name)),
    meetingGuestCookieOptions
  );
  return response;
}
