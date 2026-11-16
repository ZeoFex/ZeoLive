import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import {
  emptyFloor,
  reduceFloor,
  type FloorAction,
  type FloorState,
} from "@/lib/classroom-floor";

const TTL_SECONDS = 60 * 60 * 8;

const globalStore = globalThis as unknown as {
  __zeoliveFloor?: Map<string, FloorState>;
};

const floors = globalStore.__zeoliveFloor ?? new Map<string, FloorState>();
globalStore.__zeoliveFloor = floors;

const writeChains = new Map<string, Promise<void>>();

function cacheKey(roomId: string) {
  return `floor:${roomId}`;
}

function normalize(value: unknown): FloorState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<FloorState>;
  if (!Array.isArray(raw.requests)) return null;
  return {
    screen: raw.screen?.identity ? raw.screen : null,
    board: raw.board?.identity ? raw.board : null,
    requests: raw.requests.filter(
      (request) =>
        request &&
        (request.kind === "screen" || request.kind === "board") &&
        typeof request.identity === "string" &&
        typeof request.id === "string"
    ),
  };
}

export async function readFloor(roomId: string): Promise<FloorState> {
  const local = floors.get(roomId);
  if (local) return local;

  const cached = normalize(await cacheGet<unknown>(cacheKey(roomId)));
  if (cached) {
    floors.set(roomId, cached);
    return cached;
  }

  const empty = emptyFloor();
  floors.set(roomId, empty);
  return empty;
}

export function changeFloor(
  roomId: string,
  action: FloorAction,
  beforePublish?: (previous: FloorState, next: FloorState) => Promise<void>
): Promise<FloorState> {
  const previousWrite = writeChains.get(roomId) ?? Promise.resolve();
  const run = previousWrite.then(async () => {
    const previous = await readFloor(roomId);
    const next = reduceFloor(previous, action);
    if (next === previous) return previous;
    await beforePublish?.(previous, next);
    floors.set(roomId, next);
    await cacheSet(cacheKey(roomId), next, TTL_SECONDS);
    return next;
  });

  writeChains.set(
    roomId,
    run.then(
      () => undefined,
      () => undefined
    )
  );

  return run;
}

export async function clearFloor(roomId: string) {
  const previous = writeChains.get(roomId) ?? Promise.resolve();
  await previous;
  floors.delete(roomId);
  writeChains.delete(roomId);
  await cacheDel(cacheKey(roomId));
}
