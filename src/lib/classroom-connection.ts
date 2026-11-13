import { auth } from "@/auth";
import {
  participantDisplayName,
  verifyClassroomAccess,
  type ClassroomAccessResult,
} from "@/lib/classroom-access";
import type { ClassroomRole } from "@/lib/livekit";
import { readMeetingGuest } from "@/lib/meeting-guest";
import { prisma } from "@/lib/prisma";

const sessionInclude = {
  student: {
    select: { id: true, name: true, firstName: true, lastName: true, image: true, email: true },
  },
  tutor: {
    select: { id: true, name: true, firstName: true, lastName: true, image: true, email: true },
  },
  participants: { select: { studentId: true } },
} as const;

export interface ClassroomActor {
  role: ClassroomRole;
  identity: string;
  name: string;
  guest: boolean;
  session: NonNullable<ClassroomAccessResult["session"]>;
}

export function isShareableMeeting(session: { shareable?: boolean }) {
  return session.shareable === true;
}

export async function resolveClassroomActor(
  roomId: string,
  request: Request
): Promise<{ actor: ClassroomActor } | { error: string; status: number; code?: string }> {
  const authSession = await auth();
  const tutoring = await prisma.tutoringSession.findUnique({
    where: { roomId },
    include: sessionInclude,
  });

  if (!tutoring) {
    return { error: "Session not found", status: 404 };
  }
  if (tutoring.status === "CANCELLED") {
    return { error: "This session was cancelled", status: 403 };
  }
  if (tutoring.status === "COMPLETED") {
    return {
      error: "The tutor has ended this meeting",
      status: 403,
      code: "ended",
    };
  }

  const isHost =
    !!authSession?.user?.id &&
    (authSession.user.id === tutoring.tutorId || authSession.user.role === "ADMIN");

  if (isHost && authSession?.user?.id && authSession.user.role) {
    const access = await verifyClassroomAccess(roomId, authSession.user.id, authSession.user.role);
    if (!access.allowed || !access.session || !access.participantRole) {
      return { error: access.error ?? "Access denied", status: access.status };
    }
    return {
      actor: {
        role: access.participantRole,
        identity: authSession.user.id,
        name: participantDisplayName(
          access.participantRole === "tutor" ? access.session.tutor : access.session.student
        ),
        guest: false,
        session: access.session,
      },
    };
  }

  if (isShareableMeeting(tutoring)) {
    const guest = readMeetingGuest(request);
    if (!guest || guest.roomId !== roomId) {
      return {
        error: "Enter your name to join this meeting",
        status: 401,
        code: "join_lobby",
      };
    }
    if (tutoring.status !== "SCHEDULED" && tutoring.status !== "ACTIVE") {
      return { error: "Session is not available to join", status: 403 };
    }
    return {
      actor: {
        role: "student",
        identity: `guest:${guest.guestId}:${Date.now().toString(36)}`,
        name: guest.name,
        guest: true,
        session: tutoring,
      },
    };
  }

  if (!authSession?.user?.id || !authSession.user.role) {
    return { error: "Unauthorized", status: 401 };
  }

  const access = await verifyClassroomAccess(roomId, authSession.user.id, authSession.user.role);
  if (!access.allowed || !access.session || !access.participantRole) {
    return { error: access.error ?? "Access denied", status: access.status };
  }

  return {
    actor: {
      role: access.participantRole,
      identity: authSession.user.id,
      name: participantDisplayName(
        access.participantRole === "tutor" ? access.session.tutor : access.session.student
      ),
      guest: false,
      session: access.session,
    },
  };
}
