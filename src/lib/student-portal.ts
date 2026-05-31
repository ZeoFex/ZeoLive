import { allTutors, conversations, studentSessions } from "@/lib/mock-data";
import { routes } from "@/lib/routes";

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

export function searchStudentPortal(query: string): StudentSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: StudentSearchResult[] = [];

  for (const tutor of allTutors) {
    const haystack = [tutor.name, tutor.subject, ...tutor.subjects, tutor.bio ?? ""]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        id: `tutor-${tutor.id}`,
        type: "tutor",
        title: tutor.name,
        subtitle: `${tutor.subject} · ${tutor.rating} rating`,
        href: routes.student.book,
      });
    }
  }

  for (const session of studentSessions) {
    const haystack = `${session.subject} ${session.tutorName}`.toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        id: `session-${session.id}`,
        type: "session",
        title: session.subject,
        subtitle: `${session.tutorName} · ${session.date} ${session.time}`,
        href: routes.student.classes,
      });
    }
  }

  const seen = new Set<string>();
  return results
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    })
    .slice(0, 8);
}

export function getStudentNotifications(): StudentNotificationItem[] {
  const items: StudentNotificationItem[] = [];

  for (const session of studentSessions.filter((s) => s.status === "upcoming")) {
    items.push({
      id: `session-${session.id}`,
      type: "session_reminder",
      title: "Upcoming session",
      message: `${session.subject} with ${session.tutorName} · ${session.date} at ${session.time}`,
      href: routes.student.classes,
      createdAt: new Date(session.date).toISOString(),
    });
  }

  for (const chat of conversations.filter((c) => c.unread > 0)) {
    items.push({
      id: `message-${chat.id}`,
      type: "message",
      title: `New message from ${chat.participantName}`,
      message: chat.lastMessage,
      href: routes.student.messages,
      createdAt: new Date().toISOString(),
    });
  }

  items.push({
    id: "billing-renewal",
    type: "billing",
    title: "Subscription renewal",
    message: "Student Plus renews on May 27",
    href: routes.student.payments,
    createdAt: new Date().toISOString(),
  });

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, 10);
}
