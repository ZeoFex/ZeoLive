import { prisma } from "@/lib/prisma";

export type AdminAnalytics = {
  overview: {
    totalUsers: number;
    students: number;
    tutors: number;
    approvedTutors: number;
    pendingTutors: number;
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalMessages: number;
    conversations: number;
  };
  sessionsByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  sessionsLast6Months: { month: string; count: number }[];
  topTutors: {
    id: string;
    name: string;
    sessions: number;
    rating: number;
    reviewCount: number;
  }[];
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsers,
    students,
    tutors,
    approvedTutors,
    pendingTutors,
    totalSessions,
    activeSessions,
    completedSessions,
    totalMessages,
    conversations,
    sessionsByStatus,
    usersByRole,
    recentSessions,
    topTutorRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.tutorProfile.count({
      where: { verificationStatus: "APPROVED", verified: true },
    }),
    prisma.tutorProfile.count({
      where: {
        verificationStatus: {
          in: ["AWAITING_REVIEW", "AWAITING_RECOMMENDATION", "AWAITING_SUPERADMIN"],
        },
      },
    }),
    prisma.tutoringSession.count(),
    prisma.tutoringSession.count({ where: { status: "ACTIVE" } }),
    prisma.tutoringSession.count({ where: { status: "COMPLETED" } }),
    prisma.storedMessage.count(),
    prisma.tutorStudentConversation.count(),
    prisma.tutoringSession.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.tutoringSession.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.tutoringSession.groupBy({
      by: ["tutorId"],
      _count: { _all: true },
      orderBy: { _count: { tutorId: "desc" } },
      take: 5,
    }),
  ]);

  const monthBuckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.set(monthKey(d), 0);
  }
  for (const s of recentSessions) {
    const key = monthKey(s.createdAt);
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
    }
  }

  const tutorIds = topTutorRows.map((r) => r.tutorId);
  const tutorUsers = await prisma.user.findMany({
    where: { id: { in: tutorIds } },
    include: { tutorProfile: true },
  });
  const tutorMap = new Map(tutorUsers.map((u) => [u.id, u]));

  const { displayUserName } = await import("@/lib/portal-data");

  const topTutors = topTutorRows.map((row) => {
    const u = tutorMap.get(row.tutorId);
    return {
      id: row.tutorId,
      name: u ? displayUserName(u) : "Tutor",
      sessions: row._count._all,
      rating: u?.tutorProfile?.rating ?? 0,
      reviewCount: u?.tutorProfile?.reviewCount ?? 0,
    };
  });

  return {
    overview: {
      totalUsers,
      students,
      tutors,
      approvedTutors,
      pendingTutors,
      totalSessions,
      activeSessions,
      completedSessions,
      totalMessages,
      conversations,
    },
    sessionsByStatus: sessionsByStatus.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    usersByRole: usersByRole.map((u) => ({
      role: u.role,
      count: u._count._all,
    })),
    sessionsLast6Months: [...monthBuckets.entries()].map(([month, count]) => ({
      month,
      count,
    })),
    topTutors,
  };
}
