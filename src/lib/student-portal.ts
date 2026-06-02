import { routes } from "@/lib/routes";
import { listApprovedTutors, listPortalSessionsForUser } from "@/lib/portal-data";
import { listStudentMaterials } from "@/lib/study-materials";
import { prisma } from "@/lib/prisma";

export interface StudentSearchResult {
  id: string;
  type: "tutor" | "session" | "class";
  title: string;
  subtitle: string;
  href: string;
}

export interface StudentNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
}

export async function searchStudentPortal(
  query: string,
  studentId: string
): Promise<StudentSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: StudentSearchResult[] = [];
  const seen = new Set<string>();

  const tutors = await listApprovedTutors();
  for (const tutor of tutors) {
    const haystack = [tutor.name, tutor.subject, ...tutor.subjects, tutor.bio]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      const id = `tutor-${tutor.id}`;
      if (!seen.has(id)) {
        seen.add(id);
        results.push({
          id,
          type: "tutor",
          title: tutor.name,
          subtitle: tutor.subject,
          href: routes.student.book,
        });
      }
    }
  }

  const sessions = await listPortalSessionsForUser(studentId, "STUDENT");
  for (const session of sessions) {
    const haystack = `${session.title} ${session.subject} ${session.tutor.name}`.toLowerCase();
    if (haystack.includes(q)) {
      const id = `session-${session.id}`;
      if (!seen.has(id)) {
        seen.add(id);
        results.push({
          id,
          type: "session",
          title: session.title ?? session.subject ?? "Session",
          subtitle: `${session.tutor.name} · ${new Date(session.scheduledAt).toLocaleString()}`,
          href: routes.student.classes,
        });
      }
    }
  }

  return results.slice(0, 8);
}

export async function getStudentNotifications(
  studentId: string
): Promise<StudentNotificationItem[]> {
  const items: StudentNotificationItem[] = [];

  const sharedMaterials = await listStudentMaterials(studentId);
  for (const item of sharedMaterials.filter((m) => m.isNew).slice(0, 5)) {
    items.push({
      id: `material-${item.shareId}`,
      type: "study_material",
      title: "New study material",
      message: `${item.tutor.name} shared “${item.title}”`,
      href: routes.student.materials,
      createdAt: item.sharedAt,
    });
  }

  const sessions = await listPortalSessionsForUser(studentId, "STUDENT");
  for (const session of sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
  )) {
    items.push({
      id: `session-${session.id}`,
      type: "session_reminder",
      title: "Upcoming session",
      message: `${session.title ?? session.subject ?? "Session"} with ${session.tutor.name} · ${new Date(session.scheduledAt).toLocaleString()}`,
      href: `/classroom/${session.roomId}`,
      createdAt: session.scheduledAt,
    });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    select: { createdAt: true },
  });

  if (profile && items.length === 0) {
    items.push({
      id: "welcome",
      type: "welcome",
      title: "Welcome to Zeolive",
      message: "Browse tutors and book your first live session when you're ready.",
      href: routes.student.book,
      createdAt: profile.createdAt.toISOString(),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, 10);
}
