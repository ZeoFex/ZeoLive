import { isKnownTimeZone, nextOpenHourLabel } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import type { PortalSession } from "@/lib/session-card";
import type { Tutor } from "@/types";

export type { PortalSession } from "@/lib/session-card";
export { sessionTopic } from "@/lib/session-card";

export function displayUserName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  if (user.name?.trim()) return user.name;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user.email.split("@")[0] ?? "User";
}

export async function listApprovedTutors(viewerTimeZone = "UTC"): Promise<Tutor[]> {
  const zone = isKnownTimeZone(viewerTimeZone) ? viewerTimeZone : "UTC";
  const tutors = await prisma.user.findMany({
    where: {
      role: "TUTOR",
      tutorProfile: { verificationStatus: "APPROVED" },
    },
    include: { tutorProfile: true, lectureSubjects: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const hours = await prisma.tutorAvailabilitySlot.findMany({
    where: { tutorId: { in: tutors.map((tutor) => tutor.id) } },
    select: { tutorId: true, dayOfWeek: true, minutes: true },
  });
  const hoursByTutor = new Map<string, { dayOfWeek: number; minutes: number }[]>();
  for (const row of hours) {
    const list = hoursByTutor.get(row.tutorId) ?? [];
    list.push({ dayOfWeek: row.dayOfWeek, minutes: row.minutes });
    hoursByTutor.set(row.tutorId, list);
  }

  return tutors.map((user) => {
    const profile = user.tutorProfile!;
    const subjects = [
      ...new Set([
        ...profile.subjects,
        ...user.lectureSubjects.map((subject) => subject.name),
      ].map((name) => name.trim()).filter(Boolean)),
    ];
    const subjectList = subjects.length > 0 ? subjects : ["General"];
    return {
      id: user.id,
      name: displayUserName(user),
      email: user.email,
      avatar: user.image ?? "",
      subject: subjectList[0]!,
      subjects: subjectList,
      rating: profile.rating ?? 5,
      reviewCount: profile.reviewCount ?? 0,
      hourlyRate: profile.hourlyRate ?? 0,
      available: (hoursByTutor.get(user.id) ?? []).length > 0,
      nextOpenHour: nextOpenHourLabel({
        open: hoursByTutor.get(user.id) ?? [],
        tutorTimeZone: user.timeZone && isKnownTimeZone(user.timeZone) ? user.timeZone : "UTC",
        viewerTimeZone: zone,
      }),
      bio: profile.bio ?? "Verified Zeolive tutor.",
      experience: profile.experience
        ? parseInt(profile.experience, 10) || 0
        : 0,
      verified: true,
    };
  });
}

const sessionInclude = {
  student: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
    },
  },
  tutor: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
    },
  },
} as const;

export async function listPortalSessionsForUser(
  userId: string,
  role: "STUDENT" | "TUTOR" | "ADMIN"
): Promise<PortalSession[]> {
  const where =
    role === "TUTOR"
      ? { tutorId: userId }
      : role === "STUDENT"
        ? {
            OR: [
              { studentId: userId },
              { participants: { some: { studentId: userId } } },
            ],
          }
        : {};

  const rows = await prisma.tutoringSession.findMany({
    where,
    include: {
      ...sessionInclude,
      _count: { select: { participants: true } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    title: row.title,
    subject: row.subject,
    shareable: row.shareable,
    status: row.status,
    seatLimit: row.seatLimit,
    scheduledAt: row.scheduledAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    student: {
      id: row.student.id,
      name: displayUserName(row.student),
      image: row.student.image,
    },
    tutor: {
      id: row.tutor.id,
      name: displayUserName(row.tutor),
      image: row.tutor.image,
    },
    participantCount: row._count.participants,
  }));
}

export async function listTutorStudents(tutorUserId: string) {
  const sessions = await prisma.tutoringSession.findMany({
    where: { tutorId: tutorUserId },
    include: {
      student: {
        select: {
          id: true,
          role: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },
      participants: {
        select: {
          student: {
            select: {
              id: true,
              role: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  const byStudent = new Map<
    string,
    {
      id: string;
      name: string;
      image: string | null;
      subjects: Set<string>;
      sessionCount: number;
    }
  >();

  const remember = (
    student: (typeof sessions)[number]["student"],
    subject: string
  ) => {
    if (student.role !== "STUDENT") return;
    const existing = byStudent.get(student.id);
    if (existing) {
      existing.subjects.add(subject);
      existing.sessionCount += 1;
      return;
    }
    byStudent.set(student.id, {
      id: student.id,
      name: displayUserName(student),
      image: student.image,
      subjects: new Set([subject]),
      sessionCount: 1,
    });
  };

  for (const s of sessions) {
    const subject = s.subject ?? s.title ?? "Session";
    remember(s.student, subject);
    for (const participant of s.participants) {
      remember(participant.student, subject);
    }
  }

  return Array.from(byStudent.values()).map((s) => ({
    id: s.id,
    name: s.name,
    image: s.image,
    subjects: Array.from(s.subjects),
    sessionCount: s.sessionCount,
  }));
}

export async function getStudentDashboardSummary(studentId: string) {
  const sessions = await listPortalSessionsForUser(studentId, "STUDENT");
  const upcoming = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
  );
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const tutorIds = new Set(sessions.map((s) => s.tutor.id));

  return {
    upcoming,
    upcomingCount: upcoming.length,
    completedCount: completed.length,
    tutorCount: tutorIds.size,
  };
}

export async function getTutorDashboardSummary(tutorId: string) {
  const sessions = await listPortalSessionsForUser(tutorId, "TUTOR");
  const upcoming = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
  );
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const studentIds = new Set(
    sessions.filter((s) => s.student.id !== s.tutor.id).map((s) => s.student.id)
  );

  return {
    upcoming,
    upcomingCount: upcoming.length,
    completedCount: completed.length,
    studentCount: studentIds.size,
  };
}
