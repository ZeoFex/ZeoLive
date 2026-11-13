import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SEAT_LIMIT,
  instantForLocalSlot,
  isDueForReminder,
  isSeatFull,
  listOpenSlotsForDate,
  nextOpenHourLabel,
  seatsTaken,
  slotIsOpen,
  zonedSlot,
} from "./availability";

test("a saved hour round-trips through the tutor timezone", () => {
  const instant = instantForLocalSlot("2026-11-16", 10, 0, "Africa/Accra");
  const slot = zonedSlot(instant, "Africa/Accra");
  assert.equal(slot.dayOfWeek, 1);
  assert.equal(slot.minutes, 10 * 60);
  assert.equal(slotIsOpen(instant, "Africa/Accra", [{ dayOfWeek: 1, minutes: 600 }]), true);
  assert.equal(slotIsOpen(instant, "Africa/Accra", [{ dayOfWeek: 1, minutes: 660 }]), false);
});

test("a student in another timezone sees the same hour in their clock", () => {
  const slots = listOpenSlotsForDate({
    date: "2026-11-16",
    studentTimeZone: "America/New_York",
    tutorTimeZone: "Africa/Accra",
    open: [{ dayOfWeek: 1, minutes: 10 * 60 }],
    now: new Date("2026-11-01T00:00:00.000Z"),
  });
  assert.deepEqual(
    slots.map((slot) => slot.label),
    ["5:00 AM"]
  );
  const instant = new Date(slots[0]!.scheduledAt);
  assert.equal(zonedSlot(instant, "Africa/Accra").minutes, 600);
});

test("start-now matches the open hour even after the hour has begun", () => {
  const during = new Date("2026-11-16T10:40:00.000Z");
  assert.equal(slotIsOpen(during, "Africa/Accra", [{ dayOfWeek: 1, minutes: 600 }]), true);
});

test("seat limit counts the primary student and extra students", () => {
  assert.equal(seatsTaken(0), 1);
  assert.equal(seatsTaken(49), 50);
  assert.equal(isSeatFull(49, DEFAULT_SEAT_LIMIT), true);
  assert.equal(isSeatFull(48, DEFAULT_SEAT_LIMIT), false);
});

test("the next open hour is shown in the student's clock", () => {
  const tomorrow = nextOpenHourLabel({
    open: [{ dayOfWeek: 1, minutes: 10 * 60 }],
    tutorTimeZone: "Africa/Accra",
    viewerTimeZone: "America/New_York",
    now: new Date("2026-11-15T12:00:00.000Z"),
  });
  assert.equal(tomorrow, "Tomorrow, 5:00 AM");

  const followingWeek = nextOpenHourLabel({
    open: [{ dayOfWeek: 1, minutes: 10 * 60 }],
    tutorTimeZone: "Africa/Accra",
    viewerTimeZone: "America/New_York",
    now: new Date("2026-11-16T12:00:00.000Z"),
  });
  assert.match(followingWeek, /5:00 AM/);
});

test("a reminder is due only inside the half hour before class", () => {
  const start = new Date("2026-11-16T10:00:00.000Z");
  assert.equal(isDueForReminder(start, null, new Date("2026-11-16T09:40:00.000Z")), true);
  assert.equal(isDueForReminder(start, null, new Date("2026-11-16T09:00:00.000Z")), false);
  assert.equal(
    isDueForReminder(start, new Date("2026-11-16T09:31:00.000Z"), new Date("2026-11-16T09:40:00.000Z")),
    false
  );
});
