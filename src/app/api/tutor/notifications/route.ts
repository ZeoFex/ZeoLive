import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { conversations, tutorSessions } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { routes } from "@/lib/routes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items: {
    id: string;
    type: string;
    title: string;
    message: string;
    href: string;
    createdAt: string;
  }[] = [];

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
    select: { verificationStatus: true, updatedAt: true },
  });

  if (
    profile &&
    profile.verificationStatus !== "APPROVED" &&
    profile.verificationStatus !== "REJECTED"
  ) {
    items.push({
      id: `verification-${profile.verificationStatus}`,
      type: "verification",
      title: "Verification in progress",
      message:
        profile.verificationStatus === "AWAITING_RECOMMENDATION"
          ? "We're waiting for your faculty recommender to submit their letter."
          : "Your documents are being reviewed by the ZoeLive admin team.",
      href: routes.tutor.onboarding,
      createdAt: profile.updatedAt.toISOString(),
    });
  }

  for (const sessionItem of tutorSessions.filter((s) => s.status === "upcoming")) {
    items.push({
      id: `session-${sessionItem.id}`,
      type: "upcoming_session",
      title: "Upcoming session",
      message: `${sessionItem.subject} with ${sessionItem.tutorName} on ${sessionItem.date} at ${sessionItem.time}`,
      href: routes.tutor.sessions,
      createdAt: new Date(`${sessionItem.date}T12:00:00`).toISOString(),
    });
  }

  for (const conv of conversations.filter((c) => c.unread > 0)) {
    items.push({
      id: `message-${conv.id}`,
      type: "message",
      title: "New message",
      message: `${conv.participantName}: ${conv.lastMessage}`,
      href: routes.tutor.students,
      createdAt: new Date().toISOString(),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ items: items.slice(0, 10) });
}
