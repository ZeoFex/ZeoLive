export type PortalSessionStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type PortalSession = {
  id: string;
  roomId: string;
  title: string | null;
  subject: string | null;
  shareable: boolean;
  status: PortalSessionStatus;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  student: { id: string; name: string; image: string | null };
  tutor: { id: string; name: string; image: string | null };
  participantCount: number;
};

/** Name line on a tutor session card. Open meetings use the title until a student joins. */
export function sessionHeadline(session: {
  title: string | null;
  student: { id: string; name: string };
  tutor: { id: string };
  participantCount: number;
}) {
  if (session.student.id === session.tutor.id) {
    return session.title?.trim() || "Open meeting";
  }
  if (session.participantCount > 0) {
    return `${session.student.name} + ${session.participantCount}`;
  }
  return session.student.name;
}

export function isOpenMeeting(session: { student: { id: string }; tutor: { id: string } }) {
  return session.student.id === session.tutor.id;
}

/** Subject line for a session card. Skips auto titles like "Session with …". */
export function sessionTopic(session: { title: string | null; subject: string | null }) {
  const subject = session.subject?.trim();
  if (subject) return subject;
  const title = session.title?.trim();
  if (title && !/^session with\b/i.test(title)) return title;
  return "Tutoring session";
}
