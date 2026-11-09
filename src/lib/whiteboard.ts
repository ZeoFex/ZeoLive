export const WHITEBOARD_TOPIC = "whiteboard";

export const WHITEBOARD_COLORS = [
  "#111827",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
] as const;

export const MAX_WHITEBOARD_PAGES = 8;

export type WhiteboardPoint = { x: number; y: number };

export type WhiteboardStroke = {
  id: string;
  authorId: string;
  tool: "pen" | "eraser";
  color: string;
  width: number;
  points: WhiteboardPoint[];
};

export type BoardDocument = {
  pages: WhiteboardStroke[][];
  activePage: number;
};

export type BoardOp =
  | { type: "stroke"; page: number; stroke: WhiteboardStroke }
  | { type: "undo"; page: number; id: string }
  | { type: "clear"; page: number }
  | { type: "add-page" };

const MAX_POINTS = 280;
const MAX_STROKES = 240;

export function blankDocument(): BoardDocument {
  return { pages: [[]], activePage: 0 };
}

function copyPages(pages: WhiteboardStroke[][]): WhiteboardStroke[][] {
  return pages.length > 0 ? pages.map((page) => [...page]) : [[]];
}

export function applyBoardOp(doc: BoardDocument, op: BoardOp): BoardDocument {
  const pages = copyPages(doc.pages);

  if (op.type === "add-page") {
    if (pages.length >= MAX_WHITEBOARD_PAGES) {
      return { pages, activePage: Math.min(doc.activePage, pages.length - 1) };
    }
    pages.push([]);
    return { pages, activePage: pages.length - 1 };
  }

  if (!Number.isInteger(op.page) || op.page < 0 || op.page >= pages.length) {
    return doc;
  }

  if (op.type === "clear") {
    pages[op.page] = [];
    return { pages, activePage: doc.activePage };
  }

  if (op.type === "undo") {
    pages[op.page] = pages[op.page].filter((stroke) => stroke.id !== op.id);
    return { pages, activePage: doc.activePage };
  }

  if (pages[op.page].some((stroke) => stroke.id === op.stroke.id)) {
    return { pages, activePage: doc.activePage };
  }

  const strokes = [...pages[op.page], op.stroke];
  pages[op.page] =
    strokes.length > MAX_STROKES ? strokes.slice(strokes.length - MAX_STROKES) : strokes;
  return { pages, activePage: doc.activePage };
}

export function limitPoints(points: WhiteboardPoint[], max = MAX_POINTS): WhiteboardPoint[] {
  if (points.length <= max) return points;
  const stride = Math.ceil(points.length / max);
  const next: WhiteboardPoint[] = [];
  for (let i = 0; i < points.length && next.length < max; i += stride) next.push(points[i]);
  const last = points[points.length - 1];
  const tail = next[next.length - 1];
  if (next.length < max && (!tail || tail.x !== last.x || tail.y !== last.y)) next.push(last);
  return next.slice(0, max);
}

function isPoint(value: unknown): value is WhiteboardPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as WhiteboardPoint;
  return (
    typeof point.x === "number" &&
    typeof point.y === "number" &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= -0.02 &&
    point.x <= 1.02 &&
    point.y >= -0.02 &&
    point.y <= 1.02
  );
}

function isStroke(value: unknown): value is WhiteboardStroke {
  if (!value || typeof value !== "object") return false;
  const stroke = value as WhiteboardStroke;
  if (typeof stroke.id !== "string" || stroke.id.length < 1 || stroke.id.length > 80) return false;
  if (typeof stroke.authorId !== "string" || stroke.authorId.length < 1 || stroke.authorId.length > 128) {
    return false;
  }
  if (stroke.tool !== "pen" && stroke.tool !== "eraser") return false;
  if (typeof stroke.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(stroke.color)) return false;
  if (typeof stroke.width !== "number" || stroke.width < 0.001 || stroke.width > 0.08) return false;
  if (!Array.isArray(stroke.points) || stroke.points.length < 1 || stroke.points.length > MAX_POINTS) {
    return false;
  }
  return stroke.points.every(isPoint);
}

function readPage(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return 0;
  if (value < 0 || value >= MAX_WHITEBOARD_PAGES) return -1;
  return value;
}

export function parseBoardOp(value: unknown): BoardOp | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { type?: string; page?: unknown; id?: unknown; stroke?: unknown };
  if (record.type === "add-page") return { type: "add-page" };
  if (record.type === "clear") {
    const page = readPage(record.page);
    if (page < 0) return null;
    return { type: "clear", page };
  }
  if (record.type === "undo") {
    const page = readPage(record.page);
    if (page < 0) return null;
    if (typeof record.id !== "string" || record.id.length < 1 || record.id.length > 80) return null;
    return { type: "undo", page, id: record.id };
  }
  if (record.type === "stroke" && record.stroke && typeof record.stroke === "object") {
    const page = readPage(record.page);
    if (page < 0) return null;
    const raw = record.stroke as WhiteboardStroke;
    if (!Array.isArray(raw.points)) return null;
    const stroke = { ...raw, points: limitPoints(raw.points) };
    if (!isStroke(stroke)) return null;
    return { type: "stroke", page, stroke };
  }
  return null;
}

export function samePages(a: WhiteboardStroke[][], b: WhiteboardStroke[][]): boolean {
  if (a.length !== b.length) return false;
  for (let page = 0; page < a.length; page += 1) {
    if (a[page].length !== b[page].length) return false;
    for (let i = 0; i < a[page].length; i += 1) {
      if (a[page][i].id !== b[page][i].id) return false;
    }
  }
  return true;
}

export function pagesFromSnapshot(value: {
  pages?: unknown;
  strokes?: unknown;
}): WhiteboardStroke[][] | null {
  if (Array.isArray(value.pages)) {
    const pages = value.pages.filter((page): page is WhiteboardStroke[] => Array.isArray(page));
    return pages.length > 0 ? pages.slice(0, MAX_WHITEBOARD_PAGES) : [[]];
  }
  if (Array.isArray(value.strokes)) {
    return [value.strokes as WhiteboardStroke[]];
  }
  return null;
}
