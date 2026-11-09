import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Sessions available for attaching a new recording upload. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TUTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await prisma.tutoringSession.findMany({
    where:
      session.user.role === "TUTOR"
        ? {
            tutorId: session.user.id,
            status: { in: ["COMPLETED", "ACTIVE"] },
          }
        : {
            status: { in: ["COMPLETED", "ACTIVE"] },
          },
    orderBy: { scheduledAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      subject: true,
      scheduledAt: true,
      status: true,
      student: {
        select: { name: true, firstName: true, lastName: true, email: true },
      },
      tutor: {
        select: { name: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((item) => ({
      id: item.id,
      label: [
        item.title || item.subject || "Session",
        item.student.name ||
          [item.student.firstName, item.student.lastName].filter(Boolean).join(" ") ||
          item.student.email,
        new Date(item.scheduledAt).toLocaleString(),
      ].join(" · "),
      status: item.status,
    })),
  });
}
