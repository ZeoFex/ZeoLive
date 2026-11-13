import { prisma } from "@/lib/prisma";
import { DEFAULT_SEAT_LIMIT } from "@/lib/availability";
import { attendanceKey } from "@/lib/session-trust";

export const MAX_PARTICIPANT_LIMIT = 500;

export async function tutorParticipantLimit(tutorId: string) {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorId },
    select: { participantLimit: true },
  });
  const limit = profile?.participantLimit ?? DEFAULT_SEAT_LIMIT;
  return limit >= 1 ? limit : DEFAULT_SEAT_LIMIT;
}

export async function applyTutorParticipantLimit(tutorId: string, limit: number) {
  await prisma.tutorProfile.updateMany({
    where: { userId: tutorId },
    data: { participantLimit: limit },
  });
  await prisma.tutoringSession.updateMany({
    where: { tutorId, status: { in: ["SCHEDULED", "ACTIVE"] } },
    data: { seatLimit: limit },
  });
}

export async function meetingIsFull(input: {
  sessionId: string;
  tutorId: string;
  seatLimit: number;
  returningKey?: string | null;
  returningUserId?: string | null;
}) {
  const participants = await prisma.sessionParticipant.findMany({
    where: { tutoringSessionId: input.sessionId },
    select: { studentId: true },
  });
  const invited = new Set(participants.map((row) => row.studentId).filter((id) => id !== input.tutorId));
  if (input.returningUserId && invited.has(input.returningUserId)) return false;

  const attendance = await prisma.sessionAttendance.findMany({
    where: { tutoringSessionId: input.sessionId },
    select: { attendanceKey: true, userId: true, role: true },
  });
  if (input.returningKey && attendance.some((row) => row.attendanceKey === input.returningKey)) {
    return false;
  }
  const guests = attendance.filter(
    (row) => row.role === "guest" && (!row.userId || !invited.has(row.userId))
  );
  return invited.size + guests.length >= input.seatLimit;
}

export function returningAttendanceKey(identity: string, guest: boolean) {
  return attendanceKey(identity, guest);
}
