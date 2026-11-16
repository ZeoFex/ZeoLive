import { NextResponse } from "next/server";
import { resolveClassroomActor } from "@/lib/classroom-connection";
import { readFloor } from "@/lib/classroom-floor-store";
import { mutateBoard, readBoard } from "@/lib/whiteboard-store";
import { parseBoardOp, type BoardOp } from "@/lib/whiteboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const resolved = await resolveClassroomActor(roomId, request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (resolved.actor.session.status === "COMPLETED" || resolved.actor.session.status === "CANCELLED") {
    return NextResponse.json({ error: "This session is no longer active" }, { status: 409 });
  }

  const board = await readBoard(roomId);
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  });
}

async function studentBoardOp(
  roomId: string,
  identity: string,
  op: BoardOp
): Promise<BoardOp | NextResponse> {
  const floor = await readFloor(roomId);
  if (floor.board?.identity !== identity) {
    return NextResponse.json(
      { error: "Ask your tutor before drawing on the whiteboard" },
      { status: 403 }
    );
  }
  if (op.type === "clear" || op.type === "add-page") {
    return NextResponse.json(
      { error: "Only the tutor can clear the board or add a page" },
      { status: 403 }
    );
  }
  if (op.type === "stroke") {
    return { ...op, stroke: { ...op.stroke, authorId: identity } };
  }
  const board = await readBoard(roomId);
  const stroke = board.pages[op.page]?.find((item) => item.id === op.id);
  if (!stroke || stroke.authorId !== identity) {
    return NextResponse.json({ error: "You can undo only your own drawing" }, { status: 403 });
  }
  return op;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const resolved = await resolveClassroomActor(roomId, request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (
    resolved.actor.session.status === "COMPLETED" ||
    resolved.actor.session.status === "CANCELLED"
  ) {
    return NextResponse.json({ error: "This session is no longer active" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseBoardOp(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid whiteboard update" }, { status: 400 });
  }

  let op = parsed;
  if (resolved.actor.role !== "tutor") {
    const allowed = await studentBoardOp(roomId, resolved.actor.identity, parsed);
    if (allowed instanceof NextResponse) return allowed;
    op = allowed;
  }

  const board = await mutateBoard(roomId, op);
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  });
}
