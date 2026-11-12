import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyClassroomAccess } from "@/lib/classroom-access";
import { mutateBoard, readBoard } from "@/lib/whiteboard-store";
import { parseBoardOp } from "@/lib/whiteboard";

export const dynamic = "force-dynamic";

async function authorize(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const access = await verifyClassroomAccess(roomId, session.user.id, session.user.role);
  if (!access.allowed || !access.session) {
    return {
      error: NextResponse.json(
        { error: access.error ?? "Access denied" },
        { status: access.status }
      ),
    };
  }

  if (access.session.status === "COMPLETED" || access.session.status === "CANCELLED") {
    return {
      error: NextResponse.json({ error: "This session is no longer active" }, { status: 409 }),
    };
  }

  return { access };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { resolveClassroomActor } = await import("@/lib/classroom-connection");
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const authResult = await authorize(roomId);
  if (authResult.error) return authResult.error;
  if (authResult.access.participantRole !== "tutor") {
    return NextResponse.json(
      { error: "Only the tutor can write on the whiteboard" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const op = parseBoardOp(body);
  if (!op) {
    return NextResponse.json({ error: "Invalid whiteboard update" }, { status: 400 });
  }

  const board = await mutateBoard(roomId, op);
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  });
}
