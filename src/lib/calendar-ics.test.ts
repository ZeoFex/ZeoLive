import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionIcs } from "./calendar-ics";

test("a booking calendar file includes the class time and link", () => {
  const ics = buildSessionIcs({
    uid: "session-1",
    title: "Calculus, week 2",
    start: new Date("2026-11-16T10:00:00.000Z"),
    url: "https://zeolive.example/classroom/session-1",
    description: "Join the classroom",
  });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /UID:session-1@ztl/);
  assert.match(ics, /DTSTART:20261116T100000Z/);
  assert.match(ics, /DTEND:20261116T110000Z/);
  assert.match(ics, /SUMMARY:Calculus\\, week 2/);
  assert.match(ics, /https:\/\/zeolive\.example\/classroom\/session-1/);
});
