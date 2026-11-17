import assert from "node:assert/strict";
import test from "node:test";
import { scheduledTimeHasPassed, sessionIsPastDue } from "./session-expiry";

const start = new Date("2026-11-17T15:00:00.000Z");

test("a scheduled meeting stays open through the late window", () => {
  assert.equal(
    sessionIsPastDue({
      status: "SCHEDULED",
      scheduledAt: start,
      lateMinutes: 30,
      now: new Date("2026-11-17T15:30:00.000Z"),
    }),
    false
  );
});

test("a scheduled meeting is completed after its time window", () => {
  assert.equal(
    sessionIsPastDue({
      status: "SCHEDULED",
      scheduledAt: start,
      lateMinutes: 30,
      now: new Date("2026-11-17T15:31:00.000Z"),
    }),
    true
  );
});

test("a live class is not closed as soon as the slot ends", () => {
  assert.equal(
    sessionIsPastDue({
      status: "ACTIVE",
      scheduledAt: start,
      lateMinutes: 30,
      now: new Date("2026-11-17T16:00:00.000Z"),
    }),
    false
  );
});

test("a minute that is already over cannot be scheduled", () => {
  assert.equal(
    scheduledTimeHasPassed(
      new Date("2026-11-17T15:00:00.000Z"),
      new Date("2026-11-17T15:01:00.000Z")
    ),
    true
  );
});

test("the current minute can still be scheduled", () => {
  assert.equal(
    scheduledTimeHasPassed(
      new Date("2026-11-17T15:00:00.000Z"),
      new Date("2026-11-17T15:00:30.000Z")
    ),
    false
  );
});

test("a live class from much earlier is completed", () => {
  assert.equal(
    sessionIsPastDue({
      status: "ACTIVE",
      scheduledAt: start,
      lateMinutes: 30,
      now: new Date("2026-11-17T19:00:00.000Z"),
    }),
    true
  );
});
