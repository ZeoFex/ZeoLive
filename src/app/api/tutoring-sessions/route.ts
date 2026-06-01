import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { listPortalSessionsForUser } from "@/lib/portal-data";
import { prisma } from "@/lib/prisma";
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

    const tutor = await prisma.user.findFirst({
      where: { id: data.tutorId, role: "TUTOR" },
      include: { tutorProfile: true },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
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

    const tutoringSession = await prisma.tutoringSession.create({
      data: {
        roomId,
        studentId: session.user.id,
        tutorId: tutor.id,
        title: data.title ?? "Live tutoring session",
        subject: data.subject,
        scheduledAt,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      id: tutoringSession.id,
      roomId: tutoringSession.roomId,
      classroomUrl: `/classroom/${tutoringSession.roomId}`,
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
