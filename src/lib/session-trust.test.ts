import assert from "node:assert/strict";
import test from "node:test";
import { attendanceKey, averageRating, canLeaveReview } from "./session-trust";

test("guest attendance keeps the same person across rejoins", () => {
  const first = attendanceKey("guest:abc123:time1", true);
  const second = attendanceKey("guest:abc123:time2", true);
  assert.equal(first, "guest:abc123");
  assert.equal(second, first);
  assert.equal(attendanceKey("user_1", false), "user_1");
});

test("average rating rounds to one decimal", () => {
  assert.equal(averageRating([]), null);
  assert.equal(averageRating([5, 4, 4]), 4.3);
  assert.equal(averageRating([5]), 5);
});

test("only a student who attended a completed class can review", () => {
  const base = {
    status: "COMPLETED",
    viewerId: "student",
    viewerRole: "STUDENT",
    tutorId: "tutor",
    studentId: "student",
    participantIds: [] as string[],
    attended: true,
  };
  assert.equal(canLeaveReview(base), true);
  assert.equal(canLeaveReview({ ...base, attended: false }), false);
  assert.equal(canLeaveReview({ ...base, status: "ACTIVE" }), false);
  assert.equal(canLeaveReview({ ...base, viewerRole: "TUTOR", viewerId: "tutor" }), false);
  assert.equal(
    canLeaveReview({ ...base, studentId: "tutor", participantIds: ["student"] }),
    true
  );
});
