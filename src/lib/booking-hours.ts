import {
  isKnownTimeZone,
  isSeatFull,
  isValidSlotMinute,
  listOpenSlotsForDate,
  slotIsOpen,
  type OpenSlot,
} from "@/lib/availability";
import { tutorParticipantLimit } from "@/lib/participant-limit";
import { prisma } from "@/lib/prisma";

export async function loadTutorHours(tutorId: string) {
  const [tutor, rows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: tutorId },
      select: { timeZone: true, role: true },
    }),
    prisma.tutorAvailabilitySlot.findMany({
      where: { tutorId },
      orderBy: [{ dayOfWeek: "asc" }, { minutes: "asc" }],
    }),
  ]);
  return {
    tutor,
    timeZone: tutor?.timeZone && isKnownTimeZone(tutor.timeZone) ? tutor.timeZone : "UTC",
    slots: rows.map((row) => ({ dayOfWeek: row.dayOfWeek, minutes: row.minutes })),
  };
}

export async function openSlotsForStudent(params: {
  tutorId: string;
  date: string;
  studentTimeZone: string;
  now?: Date;
}) {
  const hours = await loadTutorHours(params.tutorId);
  if (!hours.tutor || hours.tutor.role !== "TUTOR") {
    return { error: "Tutor not found" as const, status: 404 as const };
  }
  if (!isKnownTimeZone(params.studentTimeZone)) {
    return { error: "Choose a valid timezone" as const, status: 400 as const };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    return { error: "Choose a valid date" as const, status: 400 as const };
  }

  const now = params.now ?? new Date();
  const listed = listOpenSlotsForDate({
    date: params.date,
    studentTimeZone: params.studentTimeZone,
    tutorTimeZone: hours.timeZone,
    open: hours.slots,
    now,
  });

  const dayStart = new Date(`${params.date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 48 * 60 * 60 * 1000);
  const bookings = await prisma.tutoringSession.findMany({
    where: {
      tutorId: params.tutorId,
      shareable: false,
      status: { in: ["SCHEDULED", "ACTIVE"] },
      scheduledAt: { gte: new Date(now.getTime() - 60_000), lte: dayEnd },
    },
    select: {
      scheduledAt: true,
      seatLimit: true,
      _count: { select: { participants: true } },
    },
  });

  const tutorLimit = await tutorParticipantLimit(params.tutorId);
  const slots = listed.map((slot) => {
    const booking = bookings.find((row) => row.scheduledAt.toISOString() === slot.scheduledAt);
    const participantCount = booking?._count.participants ?? 0;
    const seatLimit = booking?.seatLimit ?? tutorLimit;
    const full = booking ? isSeatFull(participantCount, seatLimit) : false;
    return {
      ...slot,
      seatsTaken: booking ? participantCount + 1 : 0,
      seatLimit,
      full,
    };
  });

  return {
    timeZone: params.studentTimeZone,
    tutorTimeZone: hours.timeZone,
    published: hours.slots.length > 0,
    seatLimit: tutorLimit,
    startNowOpen: slotIsOpen(now, hours.timeZone, hours.slots),
    slots,
  };
}

export async function assertHourIsOpen(params: {
  tutorId: string;
  scheduledAt: Date;
  startNow?: boolean;
}) {
  const hours = await loadTutorHours(params.tutorId);
  if (hours.slots.length === 0) {
    return { error: "This tutor has not published open hours yet", status: 400 as const };
  }
  const instant = params.startNow ? new Date() : params.scheduledAt;
  if (!params.startNow && instant.getTime() < Date.now() - 60_000) {
    return { error: "Choose a time that has not already passed", status: 400 as const };
  }
  if (!slotIsOpen(instant, hours.timeZone, hours.slots)) {
    return { error: "That hour is not open for this tutor", status: 400 as const };
  }
  return { hours, instant };
}

export function normalizeAvailabilitySlots(slots: OpenSlot[]) {
  const seen = new Set<string>();
  const next: OpenSlot[] = [];
  for (const slot of slots) {
    if (!Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      return null;
    }
    if (!isValidSlotMinute(slot.minutes)) return null;
    const key = `${slot.dayOfWeek}:${slot.minutes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ dayOfWeek: slot.dayOfWeek, minutes: slot.minutes });
  }
  return next;
}
