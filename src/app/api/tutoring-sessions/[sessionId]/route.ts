import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { assertHourIsOpen } from "@/lib/booking-hours";
import { buildSessionIcs } from "@/lib/calendar-ics";
import { buildBookingChangedEmail } from "@/lib/email/booking";
import { sendEmail } from "@/lib/email/transport";
import { prisma } from "@/lib/prisma";
import { reportError } from "@/lib/report-error";
import { canLeaveReview } from "@/lib/session-trust";
import { listSessionMaterials } from "@/lib/study-materials";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("reschedule"), scheduledAt: z.string().datetime() }),
  z.object({ action: z.literal("recap"), recap: z.string().max(4000) }),
]);

async function loadSession(sessionId: string) {
  return prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    include: {
      student: { select: { id: true, email: true, name: true, role: true, timeZone: true } },
      tutor: { select: { id: true, email: true, name: true, timeZone: true } },
      participants: {
        include: {
          student: { select: { id: true, email: true, name: true, timeZone: true } },
        },
      },
      recordings: {
        select: { id: true, title: true, createdAt: true, durationSeconds: true },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          studentId: true,
          createdAt: true,
          student: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      attendance: {
        select: { displayName: true, role: true, joinedAt: true, userId: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

function peopleOn(session: NonNullable<Awaited<ReturnType<typeof loadSession>>>) {
  const rows = [
    { email: session.tutor.email, name: session.tutor.name ?? "Tutor", timeZone: session.tutor.timeZone },
  ];
  if (session.student.role === "STUDENT" && session.student.id !== session.tutor.id) {
    rows.push({
      email: session.student.email,
      name: session.student.name ?? "Student",
      timeZone: session.student.timeZone,
    });
  }
  for (const participant of session.participants) {
    rows.push({
      email: participant.student.email,
      name: participant.student.name ?? "Student",
      timeZone: participant.student.timeZone,
    });
  }
  return rows;
}

async function notifyChange(
  session: NonNullable<Awaited<ReturnType<typeof loadSession>>>,
  change: "cancelled" | "rescheduled" | "left",
  recipients = peopleOn(session)
) {
  const classroomUrl = `${getAppBaseUrl()}/classroom/${session.roomId}`;
  const title = session.title?.trim() || session.subject?.trim() || "Tutoring session";
  const ics =
    change === "rescheduled"
      ? buildSessionIcs({
          uid: session.id,
          title,
          start: session.scheduledAt,
          url: classroomUrl,
          description: title,
        })
      : undefined;
  await Promise.all(
    recipients.map((person) => {
      const email = buildBookingChangedEmail({
        name: person.name,
        title,
        scheduledAt: session.scheduledAt,
        classroomUrl,
        timeZone: person.timeZone ?? session.tutor.timeZone,
        change,
      });
      return sendEmail({
        channel: "support",
        to: person.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: ics
          ? [{ filename: "ztl-session.ics", content: ics, contentType: "text/calendar" }]
          : undefined,
      });
    })
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sessionId } = await params;
  const session = await loadSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const userId = authSession.user.id;
  const allowed =
    authSession.user.role === "ADMIN" ||
    session.tutorId === userId ||
    session.studentId === userId ||
    session.participants.some((participant) => participant.studentId === userId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attended = session.attendance.some((row) => row.userId === userId);
  const myReview = session.reviews.find((review) => review.studentId === userId) ?? null;
  const canReview = canLeaveReview({
    status: session.status,
    viewerId: userId,
    viewerRole: authSession.user.role ?? "",
    tutorId: session.tutorId,
    studentId: session.studentId,
    participantIds: session.participants.map((participant) => participant.studentId),
    attended,
  });
  const canSeeReviews = session.tutorId === userId || authSession.user.role === "ADMIN";
  const materials = await listSessionMaterials(session);

  return NextResponse.json({
    id: session.id,
    roomId: session.roomId,
    title: session.title,
    subject: session.subject,
    shareable: session.shareable,
    status: session.status,
    scheduledAt: session.scheduledAt.toISOString(),
    seatLimit: session.seatLimit,
    seatsTaken: session.studentId === session.tutorId ? session.participants.length : 1 + session.participants.length,
    recap: session.recap ?? "",
    canEditRecap: session.tutorId === userId || authSession.user.role === "ADMIN",
    tutorName: session.tutor.name ?? "Tutor",
    studentName: session.student.name ?? "Student",
    materials,
    recordings: session.recordings.map((recording) => ({
      id: recording.id,
      title: recording.title,
      createdAt: recording.createdAt.toISOString(),
      durationSeconds: recording.durationSeconds,
    })),
    attendance: session.attendance.map((row) => ({
      displayName: row.displayName,
      role: row.role,
      joinedAt: row.joinedAt.toISOString(),
    })),
    canReview,
    myReview: myReview
      ? { rating: myReview.rating, comment: myReview.comment ?? "" }
      : null,
    reviews: canSeeReviews
      ? session.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment ?? "",
          studentName: review.student.name ?? "Student",
          createdAt: review.createdAt.toISOString(),
        }))
      : [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = patchSchema.parse(await request.json());
    const { sessionId } = await params;
    const session = await loadSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const userId = authSession.user.id;
    const isTutor = session.tutorId === userId || authSession.user.role === "ADMIN";
    const isPrimary = session.studentId === userId;
    const participant = session.participants.find((row) => row.studentId === userId);
    if (!isTutor && !isPrimary && !participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.shareable) {
      return NextResponse.json(
        { error: "Scheduled meetings are managed from Scheduling sessions" },
        { status: 400 }
      );
    }

    if (data.action === "recap") {
      if (!isTutor) return NextResponse.json({ error: "Only the tutor can write the recap" }, { status: 403 });
      if (session.status === "CANCELLED") {
        return NextResponse.json({ error: "This session was cancelled" }, { status: 400 });
      }
      await prisma.tutoringSession.update({
        where: { id: session.id },
        data: { recap: data.recap.trim() || null },
      });
      return NextResponse.json({ ok: true });
    }

    if (session.status !== "SCHEDULED") {
      return NextResponse.json({ error: "This session can no longer be changed" }, { status: 400 });
    }

    if (data.action === "reschedule") {
      if (!isTutor) return NextResponse.json({ error: "Only the tutor can reschedule" }, { status: 403 });
      const scheduledAt = new Date(data.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        return NextResponse.json({ error: "Choose a valid time" }, { status: 400 });
      }
      const openHour = await assertHourIsOpen({ tutorId: session.tutorId, scheduledAt });
      if ("error" in openHour) {
        return NextResponse.json({ error: openHour.error }, { status: openHour.status });
      }
      const clash = await prisma.tutoringSession.findFirst({
        where: {
          id: { not: session.id },
          tutorId: session.tutorId,
          shareable: false,
          status: { in: ["SCHEDULED", "ACTIVE"] },
          scheduledAt,
        },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: "That hour already has a booking session" },
          { status: 409 }
        );
      }
      const updated = await prisma.tutoringSession.update({
        where: { id: session.id },
        data: { scheduledAt, reminderSentAt: null },
      });
      try {
        await notifyChange({ ...session, scheduledAt: updated.scheduledAt }, "rescheduled");
      } catch (error) {
        reportError("reschedule-email", error);
      }
      return NextResponse.json({ ok: true, scheduledAt: updated.scheduledAt.toISOString() });
    }

    if (isTutor) {
      await prisma.tutoringSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED" },
      });
      try {
        await notifyChange(session, "cancelled");
      } catch (error) {
        reportError("cancel-email", error);
      }
      return NextResponse.json({ ok: true, removed: "session" });
    }

    const leaving = participant?.student ?? session.student;
    let wholeSession = false;
    if (participant) {
      await prisma.sessionParticipant.delete({ where: { id: participant.id } });
    } else if (session.participants[0]) {
      const next = session.participants[0];
      await prisma.tutoringSession.update({
        where: { id: session.id },
        data: { studentId: next.studentId },
      });
      await prisma.sessionParticipant.delete({ where: { id: next.id } });
    } else {
      wholeSession = true;
      await prisma.tutoringSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED" },
      });
    }

    try {
      if (wholeSession) {
        await notifyChange(session, "cancelled");
      } else {
        await notifyChange(session, "left", [
          { email: session.tutor.email, name: session.tutor.name ?? "Tutor", timeZone: session.tutor.timeZone },
          { email: leaving.email, name: leaving.name ?? "Student", timeZone: leaving.timeZone },
        ]);
      }
    } catch (error) {
      reportError("cancel-email", error);
    }
    return NextResponse.json({ ok: true, removed: wholeSession ? "session" : "student" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    reportError("session-update", error);
    return NextResponse.json({ error: "Could not update the session" }, { status: 500 });
  }
}
