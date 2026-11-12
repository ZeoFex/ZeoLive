import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendBookingNotificationEmails } from "@/lib/email/booking";
import { getOrCreateConversation } from "@/lib/messaging";
import { tutorTeachesSubject } from "@/lib/lectures";
import { listPortalSessionsForUser } from "@/lib/portal-data";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";
import { randomBytes } from "crypto";

const createSchema = z.object({
  tutorId: z.string().min(1),
  title: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  scheduledAt: z.string().datetime(),
  /** When true, session is bookable for the classroom immediately. */
  startNow: z.boolean().optional(),
});

/** Create a tutoring session (booking without payment for now). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only students can book sessions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const [tutor, student] = await Promise.all([
      prisma.user.findFirst({
        where: { id: data.tutorId, role: "TUTOR" },
        include: { tutorProfile: true },
      }),
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
    ]);

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (!student?.email) {
      return NextResponse.json({ error: "Student account not found" }, { status: 404 });
    }

    if (tutor.tutorProfile?.verificationStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "This tutor is not available for sessions yet" },
        { status: 400 }
      );
    }

    const scheduledAt = data.startNow ? new Date() : new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Choose a valid time" }, { status: 400 });
    }

    const subject = data.subject?.trim();
    if (!subject) {
      return NextResponse.json({ error: "Choose a subject for this session" }, { status: 400 });
    }
    const teaches = await tutorTeachesSubject(tutor.id, subject);
    if (!teaches) {
      return NextResponse.json(
        { error: "Choose a subject this tutor teaches" },
        { status: 400 }
      );
    }

    const title = data.title ?? "Live tutoring session";
    const studentName =
      student.name ??
      buildDisplayName({
        firstName: student.firstName ?? "",
        middleName: student.middleName,
        lastName: student.lastName ?? "",
      }) ??
      "Student";
    const tutorName =
      tutor.name ??
      buildDisplayName({
        firstName: tutor.firstName ?? "",
        middleName: tutor.middleName,
        lastName: tutor.lastName ?? "",
      }) ??
      "Tutor";

    const sharedBooking = data.startNow
      ? null
      : await prisma.tutoringSession.findFirst({
          where: {
            tutorId: tutor.id,
            shareable: false,
            status: { in: ["SCHEDULED", "ACTIVE"] },
            scheduledAt,
          },
          include: { participants: { select: { studentId: true } } },
        });

    if (sharedBooking) {
      const alreadyIn =
        sharedBooking.studentId === session.user.id ||
        sharedBooking.participants.some((participant) => participant.studentId === session.user.id);
      if (!alreadyIn) {
        await prisma.sessionParticipant.create({
          data: {
            tutoringSessionId: sharedBooking.id,
            studentId: session.user.id,
          },
        });
        await getOrCreateConversation(session.user.id, tutor.id);
      }

      const classroomPath = `/classroom/${sharedBooking.roomId}`;
      const classroomUrl = `${getAppBaseUrl()}${classroomPath}`;
      if (!alreadyIn) {
        try {
          await sendBookingNotificationEmails({
            student: { email: student.email, name: studentName },
            tutor: { email: tutor.email, name: tutorName },
            title: sharedBooking.title ?? title,
            subject,
            scheduledAt: sharedBooking.scheduledAt,
            classroomUrl,
          });
        } catch (emailError) {
          console.error("Booking notification email failed:", emailError);
        }
      }

      return NextResponse.json({
        id: sharedBooking.id,
        roomId: sharedBooking.roomId,
        classroomUrl: classroomPath,
        grouped: !alreadyIn,
        alreadyBooked: alreadyIn,
      });
    }

    const roomId = `session-${randomBytes(12).toString("hex")}`;

    let tutoringSession = await prisma.tutoringSession.create({
      data: {
        roomId,
        studentId: session.user.id,
        tutorId: tutor.id,
        title,
        subject,
        scheduledAt,
        status: "SCHEDULED",
        shareable: false,
      },
    });

    const earlier = await prisma.tutoringSession.findFirst({
      where: {
        tutorId: tutor.id,
        shareable: false,
        scheduledAt,
        status: { in: ["SCHEDULED", "ACTIVE"] },
        id: { not: tutoringSession.id },
        createdAt: { lt: tutoringSession.createdAt },
      },
    });
    if (earlier) {
      await prisma.sessionParticipant.upsert({
        where: {
          tutoringSessionId_studentId: {
            tutoringSessionId: earlier.id,
            studentId: session.user.id,
          },
        },
        create: {
          tutoringSessionId: earlier.id,
          studentId: session.user.id,
        },
        update: {},
      });
      await prisma.tutoringSession.delete({ where: { id: tutoringSession.id } });
      tutoringSession = earlier;
    }

    await getOrCreateConversation(session.user.id, tutor.id);

    const classroomPath = `/classroom/${tutoringSession.roomId}`;
    const classroomUrl = `${getAppBaseUrl()}${classroomPath}`;

    try {
      await sendBookingNotificationEmails({
        student: { email: student.email, name: studentName },
        tutor: { email: tutor.email, name: tutorName },
        title,
        subject,
        scheduledAt,
        classroomUrl,
      });
    } catch (emailError) {
      console.error("Booking notification email failed:", emailError);
    }

    return NextResponse.json({
      id: tutoringSession.id,
      roomId: tutoringSession.roomId,
      classroomUrl: classroomPath,
      grouped: Boolean(earlier),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Create tutoring session error:", error);
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await listPortalSessionsForUser(
    session.user.id,
    role === "ADMIN" ? "TUTOR" : role
  );

  return NextResponse.json({ sessions });
}
