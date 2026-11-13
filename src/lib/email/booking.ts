import { sendEmail } from "@/lib/email/transport";

function formatWhen(date: Date, timeZone?: string | null) {
  const when = date.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timeZone || "UTC",
  });
  return timeZone ? `${when} (${timeZone})` : when;
}

export function buildStudentBookingEmail(params: {
  studentName: string;
  tutorName: string;
  subject?: string | null;
  title: string;
  scheduledAt: Date;
  classroomUrl: string;
  timeZone?: string | null;
}) {
  const when = formatWhen(params.scheduledAt, params.timeZone);
  const subjectLine = params.subject ? ` (${params.subject})` : "";

  const text = `Hello ${params.studentName},

Your tutoring session with ${params.tutorName}${subjectLine} is booked.

Session: ${params.title}
When: ${when}

Classroom link:
${params.classroomUrl}

We will also notify your tutor. If you need help, reply to this support email.

Regards,
ZTL Support`;

  const html = `
    <p>Hello ${params.studentName},</p>
    <p>Your tutoring session with <strong>${params.tutorName}</strong>${subjectLine} is booked.</p>
    <p><strong>Session:</strong> ${params.title}<br>
    <strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Open classroom</a></p>
    <p>We will also notify your tutor. If you need help, reply to this support email.</p>
    <p>Regards,<br>ZTL Support</p>
  `.trim();

  return {
    subject: `ZTL — booking confirmed with ${params.tutorName}`,
    text,
    html,
  };
}

export function buildTutorBookingEmail(params: {
  tutorName: string;
  studentName: string;
  subject?: string | null;
  title: string;
  scheduledAt: Date;
  classroomUrl: string;
  timeZone?: string | null;
}) {
  const when = formatWhen(params.scheduledAt, params.timeZone);
  const subjectLine = params.subject ? ` (${params.subject})` : "";

  const text = `Hello ${params.tutorName},

${params.studentName} just booked a live tutoring session with you${subjectLine}.

Session: ${params.title}
When: ${when}

Classroom link:
${params.classroomUrl}

Please be ready at the scheduled time. Reply to this support email if you need help.

Regards,
ZTL Support`;

  const html = `
    <p>Hello ${params.tutorName},</p>
    <p><strong>${params.studentName}</strong> just booked a live tutoring session with you${subjectLine}.</p>
    <p><strong>Session:</strong> ${params.title}<br>
    <strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Open classroom</a></p>
    <p>Please be ready at the scheduled time. Reply to this support email if you need help.</p>
    <p>Regards,<br>ZTL Support</p>
  `.trim();

  return {
    subject: `ZTL — new booking from ${params.studentName}`,
    text,
    html,
  };
}

export function buildMeetingInviteEmail(params: {
  studentName: string;
  tutorName: string;
  subject?: string | null;
  scheduledAt: Date;
  classroomUrl: string;
  startNow: boolean;
}) {
  const when = params.startNow ? "Now" : formatWhen(params.scheduledAt);
  const topic = params.subject ? ` for ${params.subject}` : "";
  const text = `Hello ${params.studentName},

${params.tutorName} scheduled a meeting${topic}.

When: ${when}

Open this link to join the classroom:
${params.classroomUrl}

Regards,
ZTL Support`;
  const html = `
    <p>Hello ${params.studentName},</p>
    <p><strong>${params.tutorName}</strong> scheduled a meeting${topic}.</p>
    <p><strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Join the meeting</a></p>
    <p>Regards,<br>ZTL Support</p>
  `.trim();
  return {
    subject: `ZTL — ${params.tutorName} invited you to a meeting`,
    text,
    html,
  };
}

export function buildSessionStartedEmail(params: {
  studentName: string;
  tutorName: string;
  title: string;
  classroomUrl: string;
}) {
  const text = `Hello ${params.studentName},

${params.tutorName} started "${params.title}". Join the session:

${params.classroomUrl}

Regards,
ZTL Support`;
  const html = `
    <p>Hello ${params.studentName},</p>
    <p><strong>${params.tutorName}</strong> started "${params.title}".</p>
    <p><a href="${params.classroomUrl}">Join the session</a></p>
    <p>Regards,<br>ZTL Support</p>
  `.trim();
  return {
    subject: `ZTL — ${params.tutorName} started the session`,
    text,
    html,
  };
}

export function buildSessionReminderEmail(params: {
  name: string;
  title: string;
  scheduledAt: Date;
  classroomUrl: string;
  timeZone?: string | null;
}) {
  const when = formatWhen(params.scheduledAt, params.timeZone);
  const text = `Hello ${params.name},

"${params.title}" starts soon.

When: ${when}

Classroom link:
${params.classroomUrl}

A calendar file is attached.

Regards,
ZTL Support`;
  const html = `
    <p>Hello ${params.name},</p>
    <p><strong>${params.title}</strong> starts soon.</p>
    <p><strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Open classroom</a></p>
    <p>A calendar file is attached.</p>
    <p>Regards,<br>ZTL Support</p>
  `.trim();
  return {
    subject: `ZTL — ${params.title} starts soon`,
    text,
    html,
  };
}

export function buildBookingChangedEmail(params: {
  name: string;
  title: string;
  scheduledAt: Date;
  classroomUrl: string;
  timeZone?: string | null;
  change: "cancelled" | "rescheduled" | "left";
}) {
  const when = formatWhen(params.scheduledAt, params.timeZone);
  const lead =
    params.change === "cancelled"
      ? `"${params.title}" has been cancelled.`
      : params.change === "left"
        ? `A student left "${params.title}". The class still stands for everyone who remains.`
        : `"${params.title}" has a new time.`;
  const text = `Hello ${params.name},

${lead}

When: ${when}

Classroom link:
${params.classroomUrl}

Regards,
ZTL Support`;
  const html = `
    <p>Hello ${params.name},</p>
    <p>${lead}</p>
    <p><strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Open classroom</a></p>
    <p>Regards,<br>ZTL Support</p>
  `.trim();
  return {
    subject:
      params.change === "cancelled"
        ? `ZTL — ${params.title} was cancelled`
        : params.change === "left"
          ? `ZTL — a student left ${params.title}`
          : `ZTL — ${params.title} was rescheduled`,
    text,
    html,
  };
}

export async function sendBookingNotificationEmails(params: {
  student: { email: string; name: string };
  tutor: { email: string; name: string };
  title: string;
  subject?: string | null;
  scheduledAt: Date;
  classroomUrl: string;
  timeZone?: string | null;
  ics?: string;
}) {
  const studentEmail = buildStudentBookingEmail({
    studentName: params.student.name,
    tutorName: params.tutor.name,
    subject: params.subject,
    title: params.title,
    scheduledAt: params.scheduledAt,
    classroomUrl: params.classroomUrl,
    timeZone: params.timeZone,
  });

  const tutorEmail = buildTutorBookingEmail({
    tutorName: params.tutor.name,
    studentName: params.student.name,
    subject: params.subject,
    title: params.title,
    scheduledAt: params.scheduledAt,
    classroomUrl: params.classroomUrl,
    timeZone: params.timeZone,
  });

  const attachments = params.ics
    ? [{ filename: "ztl-session.ics", content: params.ics, contentType: "text/calendar" }]
    : undefined;

  const [studentResult, tutorResult] = await Promise.all([
    sendEmail({
      channel: "support",
      to: params.student.email,
      subject: studentEmail.subject,
      text: studentEmail.text,
      html: studentEmail.html,
      attachments,
    }),
    sendEmail({
      channel: "support",
      to: params.tutor.email,
      subject: tutorEmail.subject,
      text: tutorEmail.text,
      html: tutorEmail.html,
      attachments,
    }),
  ]);

  return { studentResult, tutorResult };
}
