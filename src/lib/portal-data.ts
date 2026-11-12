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

export async function listApprovedTutors(): Promise<Tutor[]> {
  const tutors = await prisma.user.findMany({
    where: {
      role: "TUTOR",
      tutorProfile: { verificationStatus: "APPROVED" },
    },
    include: { tutorProfile: true, lectureSubjects: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

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
      available: true,
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
    status: row.status,
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

  for (const s of sessions) {
    if (s.student.role !== "STUDENT") continue;
    const existing = byStudent.get(s.studentId);
    const subject = s.subject ?? s.title ?? "Session";
    if (existing) {
      existing.subjects.add(subject);
      existing.sessionCount += 1;
    } else {
      byStudent.set(s.studentId, {
        id: s.student.id,
        name: displayUserName(s.student),
        image: s.student.image,
        subjects: new Set([subject]),
        sessionCount: 1,
      });
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
