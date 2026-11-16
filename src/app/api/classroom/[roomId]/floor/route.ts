import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveClassroomActor } from "@/lib/classroom-connection";
import type { FloorAction, FloorKind, FloorState } from "@/lib/classroom-floor";
import { changeFloor, readFloor } from "@/lib/classroom-floor-store";
import {
  findRoomParticipant,
  publishFloorRefresh,
  setScreenShareAllowed,
} from "@/lib/livekit-room-admin";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), kind: z.enum(["screen", "board"]) }),
  z.object({ action: z.literal("cancel"), kind: z.enum(["screen", "board"]) }),
  z.object({
    action: z.literal("release"),
    identity: z.string().min(1).max(128).optional(),
  }),
  z.object({
    action: z.enum(["grant", "deny", "revoke"]),
    kind: z.enum(["screen", "board"]),
    identity: z.string().min(1).max(128),
  }),
]);

function visibleFloor(state: FloorState, role: "student" | "tutor", identity: string): FloorState {
  if (role === "tutor") return state;
  return {
    screen: state.screen,
    board: state.board,
    requests: state.requests.filter((request) => request.identity === identity),
  };
}

async function syncScreenHolders(
  roomId: string,
  previous: FloorState,
  next: FloorState
) {
  const from = previous.screen?.identity ?? null;
  const to = next.screen?.identity ?? null;
  if (from === to) return;
  if (to) await setScreenShareAllowed(roomId, to, true);
  if (from) {
    await setScreenShareAllowed(roomId, from, false).catch(() => undefined);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const resolved = await resolveClassroomActor(roomId, request);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const floor = await readFloor(roomId);
  return NextResponse.json(
    visibleFloor(floor, resolved.actor.role, resolved.actor.identity),
    { headers: { "Cache-Control": "no-store" } }
  );
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

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const actor = resolved.actor;
  const command = parsed.data;
  const tutorAction = command.action === "grant" || command.action === "deny" || command.action === "revoke";
  if (tutorAction && actor.role !== "tutor") {
    return NextResponse.json({ error: "Only the tutor can allow that" }, { status: 403 });
  }
  if ((command.action === "request" || command.action === "cancel") && actor.role !== "student") {
    return NextResponse.json({ error: "Students ask the tutor for this" }, { status: 403 });
  }

  let action: FloorAction;
  if (command.action === "request") {
    action = {
      type: "request",
      identity: actor.identity,
      name: actor.name,
      kind: command.kind,
      id: crypto.randomUUID(),
      at: Date.now(),
    };
  } else if (command.action === "cancel") {
    action = { type: "cancel", identity: actor.identity, kind: command.kind };
  } else if (command.action === "release") {
    const identity = actor.role === "tutor" ? command.identity : actor.identity;
    if (!identity) {
      return NextResponse.json({ error: "Choose a student to update" }, { status: 400 });
    }
    if (actor.role === "student" && command.identity && command.identity !== actor.identity) {
      return NextResponse.json({ error: "You can only give up your own permission" }, { status: 403 });
    }
    action = { type: "release", identity };
  } else if (command.action === "grant") {
    let person;
    try {
      person = await findRoomParticipant(roomId, command.identity);
    } catch {
      return NextResponse.json({ error: "The meeting is not ready for that yet" }, { status: 503 });
    }
    if (!person) {
      return NextResponse.json({ error: "That student is no longer in the meeting" }, { status: 404 });
    }
    if (person.identity === actor.identity) {
      return NextResponse.json({ error: "You already have this as the tutor" }, { status: 403 });
    }
    let role: string | null = null;
    try {
      role = (JSON.parse(person.metadata || "{}") as { role?: string }).role ?? null;
    } catch {
      role = null;
    }
    if (role === "tutor") {
      return NextResponse.json({ error: "The tutor already has this" }, { status: 403 });
    }
    action = {
      type: "grant",
      identity: command.identity,
      name: person.name?.trim() || "Student",
      kind: command.kind,
    };
  } else {
    action = {
      type: command.action,
      identity: command.identity,
      kind: command.kind as FloorKind,
    };
  }

  try {
    const floor = await changeFloor(roomId, action, (previous, next) =>
      syncScreenHolders(roomId, previous, next)
    );
    await publishFloorRefresh(roomId);
    return NextResponse.json(visibleFloor(floor, actor.role, actor.identity), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update that permission";
    const status = message.includes("no longer in the meeting") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
