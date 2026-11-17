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

test("the whiteboard stays hidden until the tutor shares it", () => {
  assert.equal(room.boardOpen, false);
  const open = reduceFloor(room, { type: "board-visibility", open: true });
  assert.equal(open.boardOpen, true);
  const sharing = reduceFloor(open, {
    type: "grant",
    identity: "student-a",
    name: "Ada",
    kind: "screen",
  });
  assert.equal(sharing.boardOpen, true);
  const closed = reduceFloor(sharing, { type: "board-visibility", open: false });
  assert.equal(closed.boardOpen, false);
  assert.equal(closed.screen?.identity, "student-a");
});

test("leaving keeps the pen until the tutor takes it back", () => {
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
  const left = reduceFloor(state, { type: "release", identity: "student-a", keepBoard: true });
  assert.equal(left.board?.identity, "student-a");
  assert.equal(left.screen?.identity, "student-b");
  assert.equal(left.requests.length, 0);

  const taken = reduceFloor(left, { type: "revoke", identity: "student-a", kind: "board" });
  assert.equal(taken.board, null);
});
