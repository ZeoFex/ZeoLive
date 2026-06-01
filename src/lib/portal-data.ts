import type { TutoringSessionStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { Tutor } from "@/types";

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
    include: { tutorProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return tutors.map((user) => {
    const profile = user.tutorProfile!;
    const subjects = profile.subjects.length > 0 ? profile.subjects : ["General"];
    return {
      id: user.id,
      name: displayUserName(user),
      email: user.email,
      avatar: user.image ?? "",
      subject: subjects[0]!,
      subjects,
      rating: 5,
      reviewCount: 0,
      hourlyRate: profile.hourlyRate ?? 0,
      available: true,
      bio: profile.bio ?? "Verified ZoeLive tutor.",
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

export type PortalSession = {
  id: string;
  roomId: string;
  title: string | null;
  subject: string | null;
  status: TutoringSessionStatus;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  student: { id: string; name: string; image: string | null };
  tutor: { id: string; name: string; image: string | null };
};

export async function listPortalSessionsForUser(
  userId: string,
  role: "STUDENT" | "TUTOR" | "ADMIN"
): Promise<PortalSession[]> {
  const where =
    role === "TUTOR"
      ? { tutorId: userId }
      : role === "STUDENT"
        ? { studentId: userId }
        : {};

  const rows = await prisma.tutoringSession.findMany({
    where,
    include: sessionInclude,
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
  }));
}

export async function listTutorStudents(tutorUserId: string) {
  const sessions = await prisma.tutoringSession.findMany({
    where: { tutorId: tutorUserId },
    include: {
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
  const studentIds = new Set(sessions.map((s) => s.student.id));

  return {
    upcoming,
    upcomingCount: upcoming.length,
    completedCount: completed.length,
    studentCount: studentIds.size,
  };
}
