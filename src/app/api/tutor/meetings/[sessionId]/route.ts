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
import { displayUserName } from "@/lib/portal-data";
import { buildDisplayName } from "@/lib/user-name";

const rescheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
  startNow: z.boolean().optional(),
  title: z.string().trim().min(2).max(120).optional(),
  subject: z.string().trim().min(2).max(60).optional(),
});

async function ownedShareableMeeting(sessionId: string, tutorId: string) {
  return prisma.tutoringSession.findFirst({
    where: { id: sessionId, tutorId, shareable: true },
    include: {
      participants: {
        select: {
          student: {
            select: {
              id: true,
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
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Only the tutor can reschedule this meeting" }, { status: 403 });
  }

  const { sessionId } = await params;
  const meeting = await ownedShareableMeeting(sessionId, session.user.id);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (meeting.status !== "COMPLETED" && meeting.status !== "CANCELLED") {
    return NextResponse.json(
      { error: "Reschedule a meeting after it has ended" },
      { status: 409 }
    );
  }

  try {
    const data = rescheduleSchema.parse(await request.json());
    const scheduledAt = data.startNow ? new Date() : new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Choose a valid time" }, { status: 400 });
    }

    let subject = meeting.subject;
    if (data.subject) {
      const createdSubject = await createLectureSubject(session.user.id, data.subject);
      if (!createdSubject.ok) {
        return NextResponse.json({ error: createdSubject.error }, { status: createdSubject.status });
      }
      subject = createdSubject.subject.name;
    }

    const roomId = `session-${randomBytes(12).toString("hex")}`;
    const title = data.title?.trim() || meeting.title || "Meeting";
    const updated = await prisma.tutoringSession.update({
      where: { id: meeting.id },
      data: {
        roomId,
        title,
        subject,
        scheduledAt,
        status: "SCHEDULED",
        startedAt: null,
        endedAt: null,
      },
    });

    const joinPath = `/join/${updated.roomId}`;
    const joinUrl = `${getAppBaseUrlFromRequest(request)}${joinPath}`;
    const tutor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, firstName: true, middleName: true, lastName: true },
    });
    const tutorName =
      tutor?.name ??
      buildDisplayName({
        firstName: tutor?.firstName ?? "",
        middleName: tutor?.middleName,
        lastName: tutor?.lastName ?? "",
      }) ??
      "Your tutor";
    const when = data.startNow
      ? "now"
      : scheduledAt.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
    const message = `${tutorName} rescheduled "${title}".\nWhen: ${when}\nJoin with this new link: ${joinUrl}\nThe previous link no longer opens the meeting.`;

    await Promise.all(
      meeting.participants.map(async ({ student }) => {
        const studentName = displayUserName(student) || "Student";
        try {
          await storeMessage({
            studentId: student.id,
            tutorId: session.user.id,
            senderId: session.user.id,
            body: message,
            channel: "DIRECT",
            tutoringSessionId: meeting.id,
          });
        } catch (error) {
          console.error("Reschedule message failed:", error);
        }
        const email = buildMeetingInviteEmail({
          studentName,
          tutorName,
          subject,
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
          console.error("Reschedule invite email failed:", error);
        });
      })
    );

    return NextResponse.json({
      id: updated.id,
      roomId: updated.roomId,
      joinPath,
      joinUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid time" }, { status: 400 });
    }
    console.error("Reschedule meeting error:", error);
    return NextResponse.json({ error: "Could not reschedule the meeting" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Only the tutor can delete this meeting" }, { status: 403 });
  }

  const { sessionId } = await params;
  const meeting = await ownedShareableMeeting(sessionId, session.user.id);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (meeting.status !== "COMPLETED" && meeting.status !== "CANCELLED") {
    return NextResponse.json({ error: "Delete a meeting after it has ended" }, { status: 409 });
  }

  await prisma.tutoringSession.delete({ where: { id: meeting.id } });
  return NextResponse.json({ ok: true });
}
