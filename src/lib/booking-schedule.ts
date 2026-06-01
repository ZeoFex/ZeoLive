/**
 * Client-safe booking time helpers (no Prisma / server-only imports).
 */

export function parseLocalScheduledAt(
  dateStr: string,
  hour: number,
  minute: number
): Date {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

/** If the chosen slot is now or within 15 minutes, treat as an immediate session. */
export function resolveBookingScheduledAt(
  dateStr: string,
  hour: number,
  minute: number,
  startNow = false
): Date {
  if (startNow) {
    return new Date();
  }

  const chosen = parseLocalScheduledAt(dateStr, hour, minute);
  const now = Date.now();
  const diff = chosen.getTime() - now;

  if (diff <= 15 * 60 * 1000) {
    return new Date();
  }

  return chosen;
}
