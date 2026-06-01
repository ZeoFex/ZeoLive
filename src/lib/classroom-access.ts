import type { Role, TutoringSession, TutoringSessionStatus, User } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type ClassroomParticipantRole = "student" | "tutor";

export interface ClassroomAccessResult {
  allowed: boolean;
  status: number;
  error?: string;
  session?: TutoringSession & {
    student: Pick<User, "id" | "name" | "firstName" | "lastName" | "image">;
    tutor: Pick<User, "id" | "name" | "firstName" | "lastName" | "image">;
  };
  participantRole?: ClassroomParticipantRole;
}

const JOINABLE_STATUSES: TutoringSessionStatus[] = ["SCHEDULED", "ACTIVE"];

function displayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email?: string | null;
}) {
  if (user.name?.trim()) return user.name;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user.email ?? "Participant";
}

export function participantDisplayName(
  user: Pick<User, "name" | "firstName" | "lastName"> & { email?: string | null }
) {
  return displayName(user);
}

export async function verifyClassroomAccess(
  roomId: string,
  userId: string,
  userRole: Role
): Promise<ClassroomAccessResult> {
  const session = await prisma.tutoringSession.findUnique({
    where: { roomId },
    include: {
      student: {
        select: { id: true, name: true, firstName: true, lastName: true, image: true, email: true },
      },
      tutor: {
        select: { id: true, name: true, firstName: true, lastName: true, image: true, email: true },
      },
    },
  });

  if (!session) {
    return { allowed: false, status: 404, error: "Session not found" };
  }

  if (session.status === "CANCELLED") {
    return { allowed: false, status: 403, error: "This session was cancelled" };
  }

  if (session.status === "COMPLETED") {
    return { allowed: false, status: 403, error: "This session has ended" };
  }

  let participantRole: ClassroomParticipantRole | undefined;

  if (userId === session.tutorId) {
    if (userRole !== "TUTOR" && userRole !== "ADMIN") {
      return { allowed: false, status: 403, error: "Only the assigned tutor can join as host" };
    }
    participantRole = "tutor";
  } else if (userId === session.studentId) {
    if (userRole !== "STUDENT" && userRole !== "ADMIN") {
      return { allowed: false, status: 403, error: "Only the enrolled student can join this session" };
    }
    participantRole = "student";
  } else if (userRole === "ADMIN") {
    participantRole = "tutor";
  } else {
    return { allowed: false, status: 403, error: "You are not part of this session" };
  }

  if (!JOINABLE_STATUSES.includes(session.status)) {
    return { allowed: false, status: 403, error: "Session is not available to join" };
  }

  if (session.status === "SCHEDULED") {
    const now = Date.now();
    const joinWindowStart = session.scheduledAt.getTime() - 15 * 60 * 1000;
    const joinWindowEnd = session.scheduledAt.getTime() + 3 * 60 * 60 * 1000;

    if (now < joinWindowStart) {
      return {
        allowed: false,
        status: 403,
        error:
          "This session has not started yet. You can join 15 minutes before the scheduled time.",
        session,
      };
    }

    if (now > joinWindowEnd) {
      return {
        allowed: false,
        status: 403,
        error: "The join window for this session has closed",
        session,
      };
    }
  }

  return {
    allowed: true,
    status: 200,
    session,
    participantRole,
  };
}

export async function markSessionActive(roomId: string) {
  await prisma.tutoringSession.updateMany({
    where: { roomId, status: "SCHEDULED" },
    data: { status: "ACTIVE", startedAt: new Date() },
  });
}

export async function markSessionCompleted(roomId: string) {
  await prisma.tutoringSession.updateMany({
    where: { roomId, status: { in: ["SCHEDULED", "ACTIVE"] } },
    data: { status: "COMPLETED", endedAt: new Date() },
  });
}
