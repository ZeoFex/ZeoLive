import assert from "node:assert/strict";
import test from "node:test";
import { emptyFloor, reduceFloor } from "./classroom-floor";

const room = emptyFloor();

test("a student request waits until the tutor grants it", () => {
  const asked = reduceFloor(room, {
    type: "request",
    identity: "student-a",
    name: "Ada",
    kind: "board",
    id: "req-1",
    at: 1,
  });
  assert.equal(asked.requests.length, 1);
  assert.equal(asked.board, null);

  const granted = reduceFloor(asked, {
    type: "grant",
    identity: "student-a",
    name: "Ada",
    kind: "board",
  });
  assert.equal(granted.board?.identity, "student-a");
  assert.equal(granted.requests.length, 0);
});

test("granting one student replaces the previous student for that tool", () => {
  const holding = reduceFloor(room, {
    type: "grant",
    identity: "student-a",
    name: "Ada",
    kind: "screen",
  });
  const switched = reduceFloor(holding, {
    type: "grant",
    identity: "student-b",
    name: "Bea",
    kind: "screen",
  });
  assert.equal(switched.screen?.identity, "student-b");
  assert.equal(switched.board, null);
});

test("other students can keep waiting while one student has the pen", () => {
  const withBoard = reduceFloor(room, {
    type: "grant",
    identity: "student-a",
    name: "Ada",
    kind: "board",
  });
  const waiting = reduceFloor(withBoard, {
    type: "request",
    identity: "student-b",
    name: "Bea",
    kind: "board",
    id: "req-2",
    at: 2,
  });
  assert.equal(waiting.board?.identity, "student-a");
  assert.equal(waiting.requests[0]?.identity, "student-b");
});

test("screen sharing and drawing are granted separately", () => {
  const screen = reduceFloor(room, {
    type: "grant",
    identity: "student-a",
    name: "Ada",
    kind: "screen",
  });
  const both = reduceFloor(screen, {
    type: "grant",
    identity: "student-b",
    name: "Bea",
    kind: "board",
  });
  assert.equal(both.screen?.identity, "student-a");
  assert.equal(both.board?.identity, "student-b");
});

test("leaving clears that student's permission and requests only", () => {
  let state = reduceFloor(room, {
    type: "grant",
    identity: "student-a",
    name: "Ada",
    kind: "board",
  });
  state = reduceFloor(state, {
    type: "request",
    identity: "student-a",
    name: "Ada",
    kind: "screen",
    id: "req-3",
    at: 3,
  });
  state = reduceFloor(state, {
    type: "grant",
    identity: "student-b",
    name: "Bea",
    kind: "screen",
  });
  const left = reduceFloor(state, { type: "release", identity: "student-a" });
  assert.equal(left.board, null);
  assert.equal(left.screen?.identity, "student-b");
  assert.equal(left.requests.length, 0);
});
