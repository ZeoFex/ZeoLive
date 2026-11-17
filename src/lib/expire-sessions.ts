import { clearFloor } from "@/lib/classroom-floor-store";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { sessionIsPastDue } from "@/lib/session-expiry";
import { clearWhiteboard } from "@/lib/whiteboard-store";

/** Mark meetings whose scheduled time has passed as completed so they cannot be started. */
export async function closeExpiredSessions(now = new Date()) {
  const platform = await getPlatformSettings();
  const open = await prisma.tutoringSession.findMany({
    where: { status: { in: ["SCHEDULED", "ACTIVE"] } },
    select: { id: true, roomId: true, status: true, scheduledAt: true },
  });
  const due = open.filter((session) =>
    sessionIsPastDue({
      status: session.status,
      scheduledAt: session.scheduledAt,
      lateMinutes: platform.sessionJoinLateMinutes,
      now,
    })
  );
  if (due.length === 0) return 0;

  await prisma.tutoringSession.updateMany({
    where: { id: { in: due.map((session) => session.id) } },
    data: { status: "COMPLETED", endedAt: now },
  });
  await Promise.all(
    due.map((session) =>
      Promise.all([clearWhiteboard(session.roomId), clearFloor(session.roomId)])
    )
  );
  return due.length;
}
