import { sendEmail } from "@/lib/email/transport";

function formatWhen(date: Date) {
  return date.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function buildStudentBookingEmail(params: {
  studentName: string;
  tutorName: string;
  subject?: string | null;
  title: string;
  scheduledAt: Date;
  classroomUrl: string;
}) {
  const when = formatWhen(params.scheduledAt);
  const subjectLine = params.subject ? ` (${params.subject})` : "";

  const text = `Hello ${params.studentName},

Your tutoring session with ${params.tutorName}${subjectLine} is booked.

Session: ${params.title}
When: ${when}

Classroom link:
${params.classroomUrl}

We will also notify your tutor. If you need help, reply to this support email.

Regards,
Zeolive Support`;

  const html = `
    <p>Hello ${params.studentName},</p>
    <p>Your tutoring session with <strong>${params.tutorName}</strong>${subjectLine} is booked.</p>
    <p><strong>Session:</strong> ${params.title}<br>
    <strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Open classroom</a></p>
    <p>We will also notify your tutor. If you need help, reply to this support email.</p>
    <p>Regards,<br>Zeolive Support</p>
  `.trim();

  return {
    subject: `Zeolive — booking confirmed with ${params.tutorName}`,
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
}) {
  const when = formatWhen(params.scheduledAt);
  const subjectLine = params.subject ? ` (${params.subject})` : "";

  const text = `Hello ${params.tutorName},

${params.studentName} just booked a live tutoring session with you${subjectLine}.

Session: ${params.title}
When: ${when}

Classroom link:
${params.classroomUrl}

Please be ready at the scheduled time. Reply to this support email if you need help.

Regards,
Zeolive Support`;

  const html = `
    <p>Hello ${params.tutorName},</p>
    <p><strong>${params.studentName}</strong> just booked a live tutoring session with you${subjectLine}.</p>
    <p><strong>Session:</strong> ${params.title}<br>
    <strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Open classroom</a></p>
    <p>Please be ready at the scheduled time. Reply to this support email if you need help.</p>
    <p>Regards,<br>Zeolive Support</p>
  `.trim();

  return {
    subject: `Zeolive — new booking from ${params.studentName}`,
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
Zeolive Support`;
  const html = `
    <p>Hello ${params.studentName},</p>
    <p><strong>${params.tutorName}</strong> scheduled a meeting${topic}.</p>
    <p><strong>When:</strong> ${when}</p>
    <p><a href="${params.classroomUrl}">Join the meeting</a></p>
    <p>Regards,<br>Zeolive Support</p>
  `.trim();
  return {
    subject: `Zeolive — ${params.tutorName} invited you to a meeting`,
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
}) {
  const studentEmail = buildStudentBookingEmail({
    studentName: params.student.name,
    tutorName: params.tutor.name,
    subject: params.subject,
    title: params.title,
    scheduledAt: params.scheduledAt,
    classroomUrl: params.classroomUrl,
  });

  const tutorEmail = buildTutorBookingEmail({
    tutorName: params.tutor.name,
    studentName: params.student.name,
    subject: params.subject,
    title: params.title,
    scheduledAt: params.scheduledAt,
    classroomUrl: params.classroomUrl,
  });

  const [studentResult, tutorResult] = await Promise.all([
    sendEmail({
      channel: "support",
      to: params.student.email,
      subject: studentEmail.subject,
      text: studentEmail.text,
      html: studentEmail.html,
    }),
    sendEmail({
      channel: "support",
      to: params.tutor.email,
      subject: tutorEmail.subject,
      text: tutorEmail.text,
      html: tutorEmail.html,
    }),
  ]);

  return { studentResult, tutorResult };
}
