import { getAppBaseUrl } from "@/lib/app-url";
import { buildSessionStartedEmail } from "@/lib/email/booking";
import { sendEmail } from "@/lib/email/transport";
import { storeMessage } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/portal-data";
import { buildDisplayName } from "@/lib/user-name";

/** Tell every booked student that the tutor has opened the classroom. */
export async function notifyBookedStudentsSessionStarted(roomId: string) {
  const session = await prisma.tutoringSession.findUnique({
    where: { roomId },
    include: {
      tutor: {
        select: { id: true, name: true, firstName: true, middleName: true, lastName: true },
      },
      student: {
        select: {
          id: true,
          role: true,
          email: true,
          name: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      },
      participants: {
        select: {
          student: {
            select: {
              id: true,
              role: true,
              email: true,
              name: true,
              firstName: true,
              middleName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
  if (!session) return;

  const tutorName =
    session.tutor.name ??
    buildDisplayName({
      firstName: session.tutor.firstName ?? "",
      middleName: session.tutor.middleName,
      lastName: session.tutor.lastName ?? "",
    }) ??
    "Your tutor";
  const title = session.title?.trim() || session.subject?.trim() || "Tutoring session";
  const classroomUrl = `${getAppBaseUrl()}/classroom/${roomId}`;
  const students = new Map<string, typeof session.student>();
  if (session.student.role === "STUDENT" && session.student.id !== session.tutorId) {
    students.set(session.student.id, session.student);
  }
  for (const participant of session.participants) {
    if (participant.student.role === "STUDENT") {
      students.set(participant.student.id, participant.student);
    }
  }

  await Promise.all(
    [...students.values()].map(async (student) => {
      const studentName =
        displayUserName(student) ||
        buildDisplayName({
          firstName: student.firstName ?? "",
          middleName: student.middleName,
          lastName: student.lastName ?? "",
        }) ||
        "Student";
      const body = `${tutorName} started "${title}". Join the session: ${classroomUrl}`;
      try {
        await storeMessage({
          studentId: student.id,
          tutorId: session.tutorId,
          senderId: session.tutorId,
          body,
          channel: "DIRECT",
          tutoringSessionId: session.id,
        });
      } catch (error) {
        console.error("Session start message failed:", error);
      }
      const email = buildSessionStartedEmail({
        studentName,
        tutorName,
        title,
        classroomUrl,
      });
      await sendEmail({
        channel: "support",
        to: student.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }).catch((error) => {
        console.error("Session start email failed:", error);
      });
    })
  );
}
