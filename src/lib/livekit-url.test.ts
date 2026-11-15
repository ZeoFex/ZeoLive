import assert from "node:assert/strict";
import test from "node:test";
import { liveKitWebsocketUrl } from "./livekit-url";

test("keeps a cloud websocket URL", () => {
  assert.equal(
    liveKitWebsocketUrl("wss://zeolive-example.livekit.cloud"),
    "wss://zeolive-example.livekit.cloud"
  );
});

test("turns an https cloud URL into wss", () => {
  assert.equal(
    liveKitWebsocketUrl("https://zeolive-example.livekit.cloud/"),
    "wss://zeolive-example.livekit.cloud"
  );
});

test("adds wss when the host was saved without a scheme", () => {
  assert.equal(
    liveKitWebsocketUrl("zeolive-example.livekit.cloud"),
    "wss://zeolive-example.livekit.cloud"
  );
});

test("rejects empty, quoted, and non-url values", () => {
  assert.equal(liveKitWebsocketUrl(""), null);
  assert.equal(liveKitWebsocketUrl("undefined"), null);
  assert.equal(liveKitWebsocketUrl('""'), null);
  assert.equal(liveKitWebsocketUrl("wss://"), null);
  assert.equal(liveKitWebsocketUrl("eyJhbGciOiJIUzI1NiJ9.payload.sig"), null);
});
