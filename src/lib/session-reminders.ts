import { buildSessionIcs } from "@/lib/calendar-ics";
import { buildSessionReminderEmail } from "@/lib/email/booking";
import { sendEmail } from "@/lib/email/transport";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";
import { REMINDER_LEAD_MS } from "@/lib/availability";

export async function sendDueSessionReminders(now = new Date()) {
  const due = await prisma.tutoringSession.findMany({
    where: {
      status: "SCHEDULED",
      reminderSentAt: null,
      scheduledAt: {
        gt: now,
        lte: new Date(now.getTime() + REMINDER_LEAD_MS),
      },
    },
    include: {
      student: { select: { id: true, email: true, name: true, role: true, timeZone: true } },
      tutor: { select: { id: true, email: true, name: true, timeZone: true } },
      participants: {
        include: { student: { select: { id: true, email: true, name: true, timeZone: true } } },
      },
    },
    take: 40,
  });

  let sent = 0;
  for (const session of due) {
    const claimed = await prisma.tutoringSession.updateMany({
      where: { id: session.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count !== 1) continue;

    const classroomUrl = `${getAppBaseUrl()}${
      session.shareable ? `/join/${session.roomId}` : `/classroom/${session.roomId}`
    }`;
    const title = session.title?.trim() || session.subject?.trim() || "ZTL session";
    const ics = buildSessionIcs({
      uid: session.id,
      title,
      start: session.scheduledAt,
      url: classroomUrl,
      description: "Your ZTL session",
    });
    const people = [
      { email: session.tutor.email, name: session.tutor.name ?? "Tutor", timeZone: session.tutor.timeZone },
      ...(session.student.role === "STUDENT" && session.student.id !== session.tutor.id
        ? [
            {
              email: session.student.email,
              name: session.student.name ?? "Student",
              timeZone: session.student.timeZone,
            },
          ]
        : []),
      ...session.participants.map((participant) => ({
        email: participant.student.email,
        name: participant.student.name ?? "Student",
        timeZone: participant.student.timeZone,
      })),
    ];

    try {
      await Promise.all(
        people.map((person) => {
          const email = buildSessionReminderEmail({
            name: person.name,
            title,
            scheduledAt: session.scheduledAt,
            classroomUrl,
            timeZone: person.timeZone,
          });
          return sendEmail({
            channel: "support",
            to: person.email,
            subject: email.subject,
            text: email.text,
            html: email.html,
            attachments: [
              { filename: "ztl-session.ics", content: ics, contentType: "text/calendar" },
            ],
          });
        })
      );
      sent += 1;
    } catch (error) {
      await prisma.tutoringSession.update({
        where: { id: session.id },
        data: { reminderSentAt: null },
      });
      reportError("session-reminder", error);
    }
  }

  return { checked: due.length, sent };
}
