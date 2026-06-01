import { routes } from "@/lib/routes";
import {
  displayUserName,
  listPortalSessionsForUser,
  listTutorStudents,
} from "@/lib/portal-data";
import { prisma } from "@/lib/prisma";

export interface TutorSearchResult {
  id: string;
  type: "student" | "session" | "subject";
  title: string;
  subtitle: string;
  href: string;
}

export async function searchTutorPortal(
  query: string,
  tutorId: string
): Promise<TutorSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: TutorSearchResult[] = [];
  const seen = new Set<string>();

  const students = await listTutorStudents(tutorId);
  for (const student of students) {
    if (student.name.toLowerCase().includes(q)) {
      const key = `student-${student.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: key,
          type: "student",
          title: student.name,
          subtitle: `${student.sessionCount} session(s)`,
          href: routes.tutor.students,
        });
      }
    }
    for (const subject of student.subjects) {
      if (subject.toLowerCase().includes(q)) {
        const subjectKey = `subject-${subject}`;
        if (!seen.has(subjectKey)) {
          seen.add(subjectKey);
          results.push({
            id: subjectKey,
            type: "subject",
            title: subject,
            subtitle: "Subject from your sessions",
            href: routes.tutor.sessions,
          });
        }
      }
    }
  }

  const sessions = await listPortalSessionsForUser(tutorId, "TUTOR");
  for (const session of sessions) {
    const haystack = `${session.title} ${session.subject} ${session.student.name}`.toLowerCase();
    if (haystack.includes(q)) {
      const sessionKey = `session-${session.id}`;
      if (!seen.has(sessionKey)) {
        seen.add(sessionKey);
        results.push({
          id: sessionKey,
          type: "session",
          title: session.title ?? session.subject ?? "Session",
          subtitle: `${session.student.name} · ${new Date(session.scheduledAt).toLocaleString()}`,
          href: routes.tutor.sessions,
        });
      }
    }
  }

  return results.slice(0, 8);
}

export async function getTutorNotifications(tutorUserId: string) {
  const items: {
    id: string;
    type: string;
    title: string;
    message: string;
    href: string;
    createdAt: string;
  }[] = [];

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { verificationStatus: true, updatedAt: true },
  });

  if (
    profile &&
    profile.verificationStatus !== "APPROVED" &&
    profile.verificationStatus !== "REJECTED"
  ) {
    items.push({
      id: `verification-${profile.verificationStatus}`,
      type: "verification",
      title: "Verification in progress",
      message:
        profile.verificationStatus === "AWAITING_RECOMMENDATION"
          ? "We're waiting for your faculty recommender to submit their letter."
          : "Your documents are being reviewed by the ZoeLive admin team.",
      href: routes.tutor.onboarding,
      createdAt: profile.updatedAt.toISOString(),
    });
  }

  const sessions = await listPortalSessionsForUser(tutorUserId, "TUTOR");
  for (const session of sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
  )) {
    items.push({
      id: `session-${session.id}`,
      type: "upcoming_session",
      title: "Upcoming session",
      message: `${session.title ?? session.subject ?? "Session"} with ${session.student.name} · ${new Date(session.scheduledAt).toLocaleString()}`,
      href: `/classroom/${session.roomId}`,
      createdAt: session.scheduledAt,
    });
  }

  if (items.length === 0 && profile?.verificationStatus === "APPROVED") {
    items.push({
      id: "no-sessions",
      type: "info",
      title: "No upcoming sessions",
      message: "When students book you, sessions will appear here.",
      href: routes.tutor.sessions,
      createdAt: new Date().toISOString(),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, 10);
}
