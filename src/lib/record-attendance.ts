import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";
import { attendanceKey } from "@/lib/session-trust";

export async function linkedAccountUserId(actor: {
  guest: boolean;
  identity: string;
  session: { id: string; tutorId: string };
}) {
  if (!actor.guest) return actor.identity;
  const authSession = await auth();
  const userId = authSession?.user?.id;
  if (!userId || authSession.user.role !== "STUDENT" || userId === actor.session.tutorId) {
    return null;
  }
  const onSession = await prisma.tutoringSession.findFirst({
    where: {
      id: actor.session.id,
      OR: [{ studentId: userId }, { participants: { some: { studentId: userId } } }],
    },
    select: { id: true },
  });
  return onSession ? userId : null;
}

export async function recordSessionAttendance(input: {
  tutoringSessionId: string;
  identity: string;
  guest: boolean;
  displayName: string;
  role: string;
}) {
  const key = attendanceKey(input.identity, input.guest);
  const now = new Date();
  try {
    await prisma.sessionAttendance.upsert({
      where: {
        tutoringSessionId_attendanceKey: {
          tutoringSessionId: input.tutoringSessionId,
          attendanceKey: key,
        },
      },
      create: {
        tutoringSessionId: input.tutoringSessionId,
        attendanceKey: key,
        userId: input.guest ? null : input.identity,
        displayName: input.displayName,
        role: input.guest ? "guest" : input.role,
        joinedAt: now,
        lastSeenAt: now,
      },
      update: {
        displayName: input.displayName,
        lastSeenAt: now,
      },
    });
  } catch (error) {
    reportError("session-attendance", error);
  }
}

export async function refreshTutorRating(tutorId: string) {
  const summary = await prisma.sessionReview.aggregate({
    where: { tutorId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const reviewCount = summary._count.rating;
  const rating = summary._avg.rating == null ? 4.8 : Math.round(summary._avg.rating * 10) / 10;
  await prisma.tutorProfile.updateMany({
    where: { userId: tutorId },
    data: { rating, reviewCount },
  });
}
