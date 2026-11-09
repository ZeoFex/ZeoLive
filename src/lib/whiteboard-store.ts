import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import {
  applyBoardOp,
  blankDocument,
  type BoardOp,
  type WhiteboardStroke,
} from "@/lib/whiteboard";

const TTL_SECONDS = 60 * 60 * 8;

export type BoardState = {
  pages: WhiteboardStroke[][];
  revision: number;
};

const globalStore = globalThis as unknown as {
  __zeoliveWhiteboard?: Map<string, BoardState>;
};

const boards = globalStore.__zeoliveWhiteboard ?? new Map<string, BoardState>();
globalStore.__zeoliveWhiteboard = boards;

const writeChains = new Map<string, Promise<void>>();

function cacheKey(roomId: string) {
  return `whiteboard:${roomId}`;
}

function normalizeCached(value: unknown): BoardState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { pages?: unknown; strokes?: unknown; revision?: unknown };
  if (typeof raw.revision !== "number") return null;
  if (Array.isArray(raw.pages) && raw.pages.every(Array.isArray)) {
    const pages = (raw.pages as WhiteboardStroke[][]).slice(0, 8);
    return { pages: pages.length > 0 ? pages : [[]], revision: raw.revision };
  }
  if (Array.isArray(raw.strokes)) {
    return { pages: [raw.strokes as WhiteboardStroke[]], revision: raw.revision };
  }
  return null;
}

export async function readBoard(roomId: string): Promise<BoardState> {
  const local = boards.get(roomId);
  if (local) return local;

  const cached = normalizeCached(await cacheGet<unknown>(cacheKey(roomId)));
  if (cached) {
    boards.set(roomId, cached);
    return cached;
  }

  const empty = { pages: blankDocument().pages, revision: 0 };
  boards.set(roomId, empty);
  return empty;
}

export function mutateBoard(roomId: string, op: BoardOp): Promise<BoardState> {
  const previous = writeChains.get(roomId) ?? Promise.resolve();
  const run = previous.then(async () => {
    const current = await readBoard(roomId);
    const nextDoc = applyBoardOp(
      { pages: current.pages, activePage: 0 },
      op
    );
    const next: BoardState = {
      pages: nextDoc.pages,
      revision: current.revision + 1,
    };
    boards.set(roomId, next);
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

export async function clearWhiteboard(roomId: string): Promise<void> {
  const previous = writeChains.get(roomId) ?? Promise.resolve();
  await previous;
  boards.delete(roomId);
  writeChains.delete(roomId);
  await cacheDel(cacheKey(roomId));
}
