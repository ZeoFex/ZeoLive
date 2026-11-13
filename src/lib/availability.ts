export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export const DEFAULT_SEAT_LIMIT = 50;
export const SESSION_MINUTES = 60;
export const REMINDER_LEAD_MS = 30 * 60 * 1000;

export type OpenSlot = { dayOfWeek: number; minutes: number };

export function isKnownTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function zonedParts(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const bag: Record<string, string> = {};
  for (const part of formatted) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday: WEEKDAY_INDEX[bag.weekday] ?? 0,
  };
}

export function timeZoneOffsetMs(date: Date, timeZone: string) {
  const part = zonedParts(date, timeZone);
  const asUtc = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second);
  return asUtc - date.getTime();
}

/** Wall-clock date and hour in `timeZone`, returned as a UTC instant. */
export function instantForLocalSlot(
  dateStr: string,
  hour: number,
  minute: number,
  timeZone: string
) {
  const [year, month, day] = dateStr.split("-").map((value) => Number(value));
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone);
  const adjusted = utcGuess - timeZoneOffsetMs(new Date(utc), timeZone);
  if (adjusted !== utc) utc = adjusted;
  return new Date(utc);
}

export function zonedSlot(date: Date, timeZone: string) {
  const part = zonedParts(date, timeZone);
  return { dayOfWeek: part.weekday, minutes: part.hour * 60 + part.minute };
}

export function formatSlotLabel(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00 ${period}`;
}

export function slotIsOpen(instant: Date, tutorTimeZone: string, open: OpenSlot[]) {
  const slot = zonedSlot(instant, tutorTimeZone);
  const hourStart = Math.floor(slot.minutes / 60) * 60;
  return open.some((row) => row.dayOfWeek === slot.dayOfWeek && row.minutes === hourStart);
}

export function listOpenSlotsForDate(params: {
  date: string;
  studentTimeZone: string;
  tutorTimeZone: string;
  open: OpenSlot[];
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const results: { label: string; scheduledAt: string }[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const instant = instantForLocalSlot(params.date, hour, 0, params.studentTimeZone);
    if (instant.getTime() < now.getTime() - 60_000) continue;
    if (!slotIsOpen(instant, params.tutorTimeZone, params.open)) continue;
    results.push({ label: formatSlotLabel(hour * 60), scheduledAt: instant.toISOString() });
  }
  return results;
}

export function seatsTaken(participantCount: number) {
  return 1 + Math.max(0, participantCount);
}

export function isSeatFull(participantCount: number, seatLimit: number) {
  return seatsTaken(participantCount) >= seatLimit;
}

export function viewerDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shiftViewerDate(dateStr: string, days: number, timeZone: string) {
  const noon = instantForLocalSlot(dateStr, 12, 0, timeZone);
  return viewerDate(new Date(noon.getTime() + days * 24 * 60 * 60 * 1000), timeZone);
}

/** First bookable hour in the viewer's clock, within the next two weeks. */
export function nextOpenHourLabel(params: {
  open: OpenSlot[];
  tutorTimeZone: string;
  viewerTimeZone: string;
  now?: Date;
}) {
  if (params.open.length === 0) return "No open hours";
  const now = params.now ?? new Date();
  const viewerTimeZone = isKnownTimeZone(params.viewerTimeZone) ? params.viewerTimeZone : "UTC";
  const tutorTimeZone = isKnownTimeZone(params.tutorTimeZone) ? params.tutorTimeZone : "UTC";
  let date = viewerDate(now, viewerTimeZone);
  for (let day = 0; day < 14; day += 1) {
    const slots = listOpenSlotsForDate({
      date,
      studentTimeZone: viewerTimeZone,
      tutorTimeZone,
      open: params.open,
      now,
    });
    const slot = slots[0];
    if (slot) {
      if (day === 0) return `Today, ${slot.label}`;
      if (day === 1) return `Tomorrow, ${slot.label}`;
      const when = new Intl.DateTimeFormat("en-US", {
        timeZone: viewerTimeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(instantForLocalSlot(date, 12, 0, viewerTimeZone));
      return `${when}, ${slot.label}`;
    }
    date = shiftViewerDate(date, 1, viewerTimeZone);
  }
  return "No open hours";
}

export function isDueForReminder(scheduledAt: Date, reminderSentAt: Date | null, now: Date) {
  if (reminderSentAt) return false;
  const lead = scheduledAt.getTime() - now.getTime();
  return lead > 0 && lead <= REMINDER_LEAD_MS;
}

export function isValidSlotMinute(minutes: number) {
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 23 * 60 && minutes % 60 === 0;
}
