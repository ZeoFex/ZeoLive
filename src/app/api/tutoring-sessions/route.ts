import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendBookingNotificationEmails } from "@/lib/email/booking";
import { getOrCreateConversation } from "@/lib/messaging";
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

    const roomId = `session-${randomBytes(12).toString("hex")}`;
    let scheduledAt = new Date(data.scheduledAt);

    if (data.startNow) {
      scheduledAt = new Date();
    } else {
      const now = Date.now();
      if (scheduledAt.getTime() - now <= 15 * 60 * 1000) {
        scheduledAt = new Date();
      }
    }

    const title = data.title ?? "Live tutoring session";

    const tutoringSession = await prisma.tutoringSession.create({
      data: {
        roomId,
        studentId: session.user.id,
        tutorId: tutor.id,
        title,
        subject: data.subject,
        scheduledAt,
        status: "SCHEDULED",
      },
    });

    await getOrCreateConversation(session.user.id, tutor.id);

    const classroomPath = `/classroom/${tutoringSession.roomId}`;
    const classroomUrl = `${getAppBaseUrl()}${classroomPath}`;
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

    try {
      await sendBookingNotificationEmails({
        student: { email: student.email, name: studentName },
        tutor: { email: tutor.email, name: tutorName },
        title,
        subject: data.subject,
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
