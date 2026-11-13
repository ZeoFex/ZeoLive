import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAppBaseUrlFromRequest } from "@/lib/app-url";
import { buildMeetingInviteEmail } from "@/lib/email/booking";
import { sendEmail } from "@/lib/email/transport";
import { createLectureSubject } from "@/lib/lectures";
import { storeMessage } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import { tutorParticipantLimit } from "@/lib/participant-limit";
import { displayUserName } from "@/lib/portal-data";
import { buildDisplayName } from "@/lib/user-name";

const createSchema = z.object({
  studentIds: z.array(z.string().min(1)).default([]),
  subject: z.string().trim().min(2).max(60),
  scheduledAt: z.string().datetime(),
  startNow: z.boolean().optional(),
  title: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Only tutors can schedule a meeting" }, { status: 403 });
  }

  try {
    const data = createSchema.parse(await request.json());
    const studentIds = [...new Set(data.studentIds)];
    const subject = data.subject.trim();
    const title = data.title.trim();
    const createdSubject = await createLectureSubject(session.user.id, subject);
    if (!createdSubject.ok) {
      return NextResponse.json({ error: createdSubject.error }, { status: createdSubject.status });
    }

    const [tutor, students] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          email: true,
          name: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      }),
      prisma.user.findMany({
        where: { id: { in: studentIds }, role: "STUDENT" },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      }),
    ]);

    if (!tutor) {
      return NextResponse.json({ error: "Tutor account not found" }, { status: 404 });
    }
    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: "Choose valid student accounts" }, { status: 400 });
    }

    const scheduledAt = data.startNow ? new Date() : new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Choose a valid time" }, { status: 400 });
    }

    const seatLimit = await tutorParticipantLimit(session.user.id);
    if (students.length > seatLimit) {
      return NextResponse.json(
        { error: `This meeting can include up to ${seatLimit} participants` },
        { status: 400 }
      );
    }

    const roomId = `session-${randomBytes(12).toString("hex")}`;

    const tutoringSession = await prisma.tutoringSession.create({
      data: {
        roomId,
        studentId: students[0]?.id ?? session.user.id,
        tutorId: session.user.id,
        title,
        subject: createdSubject.subject.name,
        shareable: true,
        seatLimit,
        scheduledAt,
        status: "SCHEDULED",
        ...(students.length > 0
          ? {
              participants: {
                create: students.map((student) => ({ studentId: student.id })),
              },
            }
          : {}),
      },
    });

    const joinPath = `/join/${tutoringSession.roomId}`;
    const joinUrl = `${getAppBaseUrlFromRequest(request)}${joinPath}`;
    const when = data.startNow
      ? "now"
      : scheduledAt.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
    const tutorName =
      tutor.name ??
      buildDisplayName({
        firstName: tutor.firstName ?? "",
        middleName: tutor.middleName,
        lastName: tutor.lastName ?? "",
      }) ??
      "Your tutor";
    const message = `${tutorName} scheduled "${title}" for ${createdSubject.subject.name}.\nWhen: ${when}\nJoin the meeting: ${joinUrl}\nOpen the link, enter the name you want shown, choose your microphone and camera, then join. No account is required.`;

    await Promise.all(
      students.map(async (student) => {
        const studentName =
          displayUserName(student) ||
          buildDisplayName({
            firstName: student.firstName ?? "",
            middleName: student.middleName,
            lastName: student.lastName ?? "",
          }) ||
          "Student";
        await storeMessage({
          studentId: student.id,
          tutorId: session.user.id,
          senderId: session.user.id,
          body: message,
          channel: "DIRECT",
          tutoringSessionId: tutoringSession.id,
        });
        const email = buildMeetingInviteEmail({
          studentName,
          tutorName,
          subject: createdSubject.subject.name,
          scheduledAt,
          classroomUrl: joinUrl,
          startNow: Boolean(data.startNow),
        });
        await sendEmail({
          channel: "support",
          to: student.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
        }).catch((error) => {
          console.error("Meeting invite email failed:", error);
        });
      })
    );

    return NextResponse.json({
      id: tutoringSession.id,
      roomId: tutoringSession.roomId,
      joinPath,
      joinUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Add a title, a subject, and a time" }, { status: 400 });
    }
    console.error("Schedule meeting error:", error);
    const message = error instanceof Error ? error.message : "Could not schedule the meeting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
