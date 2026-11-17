/** Extra time after the slot so a class that already started is not closed mid-lesson. */
export const LIVE_CLASS_GRACE_MINUTES = 180;

/**
 * A scheduled meeting is past due once the join window after its time has
 * closed. A live meeting gets a longer grace so the tutor can finish the class.
 */
export function sessionIsPastDue(input: {
  status: string;
  scheduledAt: Date;
  lateMinutes: number;
  now: Date;
  liveGraceMinutes?: number;
}) {
  if (input.status !== "SCHEDULED" && input.status !== "ACTIVE") return false;
  const lateMs = Math.max(0, input.lateMinutes) * 60_000;
  const liveMs =
    input.status === "ACTIVE"
      ? Math.max(0, input.liveGraceMinutes ?? LIVE_CLASS_GRACE_MINUTES) * 60_000
      : 0;
  return input.now.getTime() > input.scheduledAt.getTime() + lateMs + liveMs;
}
