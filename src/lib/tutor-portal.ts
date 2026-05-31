import { conversations, tutorSessions } from "@/lib/mock-data";
import { routes } from "@/lib/routes";

export interface TutorSearchResult {
  id: string;
  type: "student" | "session" | "subject";
  title: string;
  subtitle: string;
  href: string;
}

const MATERIALS = [
  { id: "1", name: "Calculus II — Integration Notes.pdf" },
  { id: "2", name: "Practice Problems Set 4.pdf" },
  { id: "3", name: "Algebra Cheat Sheet.pdf" },
];

export function searchTutorPortal(query: string): TutorSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: TutorSearchResult[] = [];
  const seen = new Set<string>();

  for (const session of tutorSessions) {
    if (
      session.tutorName.toLowerCase().includes(q) ||
      session.subject.toLowerCase().includes(q)
    ) {
      const key = `student-${session.tutorName}`;
      if (!seen.has(key) && session.tutorName.toLowerCase().includes(q)) {
        seen.add(key);
        results.push({
          id: key,
          type: "student",
          title: session.tutorName,
          subtitle: `Student · ${session.subject}`,
          href: routes.tutor.students,
        });
      }

      if (session.subject.toLowerCase().includes(q)) {
        const subjectKey = `subject-${session.subject}`;
        if (!seen.has(subjectKey)) {
          seen.add(subjectKey);
          results.push({
            id: subjectKey,
            type: "subject",
            title: session.subject,
            subtitle: "Subject · upcoming sessions",
            href: routes.tutor.sessions,
          });
        }
      }

      const sessionKey = `session-${session.id}`;
      if (!seen.has(sessionKey)) {
        seen.add(sessionKey);
        results.push({
          id: sessionKey,
          type: "session",
          title: `${session.subject} with ${session.tutorName}`,
          subtitle: `${session.date} · ${session.time}`,
          href: routes.tutor.sessions,
        });
      }
    }
  }

  for (const conv of conversations) {
    if (conv.participantName.toLowerCase().includes(q)) {
      const key = `conv-${conv.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: key,
          type: "student",
          title: conv.participantName,
          subtitle: "Recent message",
          href: routes.tutor.students,
        });
      }
    }
  }

  for (const material of MATERIALS) {
    if (material.name.toLowerCase().includes(q)) {
      results.push({
        id: `material-${material.id}`,
        type: "subject",
        title: material.name,
        subtitle: "Learning material",
        href: routes.tutor.materials,
      });
    }
  }

  return results.slice(0, 8);
}
