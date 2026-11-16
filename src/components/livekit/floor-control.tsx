"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type RemoteParticipant } from "livekit-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FLOOR_TOPIC,
  type FloorHolder,
  type FloorKind,
  type FloorRequest,
  type FloorState,
} from "@/lib/classroom-floor";
import type { ClassroomRole } from "@/lib/livekit";

type FloorContextValue = {
  role: ClassroomRole;
  identity: string;
  screen: FloorHolder | null;
  board: FloorHolder | null;
  requests: FloorRequest[];
  busy: boolean;
  pending: (kind: FloorKind) => boolean;
  request: (kind: FloorKind) => Promise<void>;
  cancel: (kind: FloorKind) => Promise<void>;
  grant: (kind: FloorKind, identity: string) => Promise<void>;
  deny: (kind: FloorKind, identity: string) => Promise<void>;
  revoke: (kind: FloorKind, identity: string) => Promise<void>;
};

const FloorContext = createContext<FloorContextValue | null>(null);

function kindLabel(kind: FloorKind) {
  return kind === "screen" ? "share their screen" : "draw on the whiteboard";
}

export function FloorProvider({
  roomId,
  role,
  children,
}: {
  roomId: string;
  role: ClassroomRole;
  children: ReactNode;
}) {
  const room = useRoomContext();
  const identity = room.localParticipant.identity;
  const [floor, setFloor] = useState<FloorState>({ screen: null, board: null, requests: [] });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const announced = useRef(new Set<string>());
  const seenGrant = useRef<{ ready: boolean; screen: string | null; board: string | null }>({
    ready: false,
    screen: null,
    board: null,
  });
  const floorRef = useRef(floor);

  const applyState = useCallback((next: FloorState) => {
    setFloor({
      screen: next.screen ?? null,
      board: next.board ?? null,
      requests: Array.isArray(next.requests) ? next.requests : [],
    });
  }, []);

  useEffect(() => {
    floorRef.current = floor;
  }, [floor]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/classroom/${roomId}/floor`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return;
    applyState((await res.json()) as FloorState);
    setLoaded(true);
  }, [applyState, roomId]);

  const post = useCallback(
    async (body: Record<string, string>) => {
      const res = await fetch(`/api/classroom/${roomId}/floor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as FloorState & { error?: string };
      if (!res.ok) {
        throw new Error(json.error || "Could not update that permission");
      }
      applyState(json);
      return json;
    },
    [applyState, roomId]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!cancelled) await refresh();
      } catch {
        /* The next refresh retries. */
      }
    };
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const onData = (
      _payload: Uint8Array,
      _participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== FLOOR_TOPIC) return;
      void refresh();
    };
    const onLeave = (participant: RemoteParticipant) => {
      if (role !== "tutor") return;
      const current = floorRef.current;
      const holds =
        current.screen?.identity === participant.identity ||
        current.board?.identity === participant.identity ||
        current.requests.some((request) => request.identity === participant.identity);
      if (!holds) return;
      void post({ action: "release", identity: participant.identity }).catch(() => undefined);
    };
    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [post, refresh, role, room]);

  useEffect(() => {
    if (role !== "tutor") return;
    const ids = new Set(floor.requests.map((request) => request.id));
    for (const id of announced.current) {
      if (!ids.has(id)) {
        toast.dismiss(id);
        announced.current.delete(id);
      }
    }
    for (const request of floor.requests) {
      if (announced.current.has(request.id)) continue;
      announced.current.add(request.id);
      toast(`${request.name} wants to ${kindLabel(request.kind)}`, {
        id: request.id,
        duration: 20000,
        action: {
          label: "Allow",
          onClick: () => {
            void post({ action: "grant", kind: request.kind, identity: request.identity })
              .then(() => {
                toast.success(
                  request.kind === "screen"
                    ? `${request.name} can share their screen`
                    : `${request.name} can draw. The class can see it.`
                );
              })
              .catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : "Could not allow that");
              });
          },
        },
        cancel: {
          label: "No",
          onClick: () => {
            void post({ action: "deny", kind: request.kind, identity: request.identity }).catch(
              (error: unknown) => {
                toast.error(error instanceof Error ? error.message : "Could not decline that");
              }
            );
          },
        },
      });
    }
  }, [floor.requests, post, role]);

  useEffect(() => {
    if (role !== "student" || !loaded) return;
    const screenId = floor.screen?.identity ?? null;
    const boardId = floor.board?.identity ?? null;
    const prev = seenGrant.current;
    if (!prev.ready) {
      seenGrant.current = { ready: true, screen: screenId, board: boardId };
      return;
    }
    if (prev.screen !== identity && screenId === identity) {
      toast.success("Your tutor allowed screen sharing. Tap Share to start.");
    }
    if (prev.screen === identity && screenId !== identity) {
      toast.message("Your tutor stopped your screen sharing.");
    }
    if (prev.board !== identity && boardId === identity) {
      toast.success("You can draw on the whiteboard. Everyone in this class can see it.");
    }
    if (prev.board === identity && boardId !== identity) {
      toast.message("Your tutor took back the whiteboard pen.");
    }
    seenGrant.current = { ready: true, screen: screenId, board: boardId };
  }, [floor.board, floor.screen, identity, loaded, role]);

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setBusy(true);
      try {
        await task();
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const value = useMemo<FloorContextValue>(
    () => ({
      role,
      identity,
      screen: floor.screen,
      board: floor.board,
      requests: floor.requests,
      busy,
      pending: (kind) => floor.requests.some((request) => request.kind === kind && request.identity === identity),
      request: (kind) => run(() => post({ action: "request", kind }).then(() => undefined)),
      cancel: (kind) => run(() => post({ action: "cancel", kind }).then(() => undefined)),
      grant: (kind, target) =>
        run(async () => {
          const next = await post({ action: "grant", kind, identity: target });
          const name = kind === "screen" ? next.screen?.name : next.board?.name;
          toast.success(
            kind === "screen"
              ? `${name ?? "That student"} can share their screen`
              : `${name ?? "That student"} can draw. The class can see it.`
          );
        }),
      deny: (kind, target) => run(() => post({ action: "deny", kind, identity: target }).then(() => undefined)),
      revoke: (kind, target) =>
        run(() => post({ action: "revoke", kind, identity: target }).then(() => undefined)),
    }),
    [busy, floor.board, floor.requests, floor.screen, identity, post, role, run]
  );

  return <FloorContext.Provider value={value}>{children}</FloorContext.Provider>;
}

export function useFloor() {
  const value = useContext(FloorContext);
  if (!value) {
    throw new Error("Floor controls are only available inside a class");
  }
  return value;
}

export function FloorRequestBanner() {
  const floor = useFloor();
  if (floor.role !== "tutor" || floor.requests.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
      {floor.requests.map((request) => (
        <div key={request.id} className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">{request.name}</span> wants to {kindLabel(request.kind)}
          </p>
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full"
            disabled={floor.busy}
            onClick={() => {
              void floor.grant(request.kind, request.identity).catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : "Could not allow that");
              });
            }}
          >
            Allow
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-full bg-white"
            disabled={floor.busy}
            onClick={() => {
              void floor.deny(request.kind, request.identity).catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : "Could not decline that");
              });
            }}
          >
            No
          </Button>
        </div>
      ))}
    </div>
  );
}
