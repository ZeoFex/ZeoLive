"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyBoardOp,
  pagesFromSnapshot,
  parseBoardOp,
  samePages,
  WHITEBOARD_TOPIC,
  type BoardDocument,
  type BoardOp,
  type WhiteboardStroke,
} from "@/lib/whiteboard";

type BoardSnapshot = {
  pages?: WhiteboardStroke[][];
  strokes?: WhiteboardStroke[];
  revision: number;
};

type ExtraStroke = {
  page: number;
  stroke: WhiteboardStroke;
  at: number;
};

const EXTRA_TTL_MS = 8000;

export function useWhiteboard(roomId: string) {
  const room = useRoomContext();
  const [pages, setPages] = useState<WhiteboardStroke[][]>([[]]);
  const [activePage, setActivePage] = useState(0);
  const revisionRef = useRef(0);
  const pendingRef = useRef<BoardOp[]>([]);
  const extrasRef = useRef<ExtraStroke[]>([]);
  const tombstonesRef = useRef<Set<string>>(new Set());
  const pagesRef = useRef(pages);
  const activeRef = useRef(activePage);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    activeRef.current = activePage;
  }, [activePage]);

  const documentFrom = useCallback(
    (nextPages: WhiteboardStroke[][], page = activeRef.current): BoardDocument => ({
      pages: nextPages.length > 0 ? nextPages : [[]],
      activePage: page,
    }),
    []
  );

  const reconcile = useCallback(
    (serverPages: WhiteboardStroke[][]) => {
      const now = Date.now();
      const base = serverPages.length > 0 ? serverPages.map((page) => [...page]) : [[]];
      const serverIds = new Set(base.flat().map((stroke) => stroke.id));
      extrasRef.current = extrasRef.current.filter(
        (extra) =>
          !serverIds.has(extra.stroke.id) &&
          !tombstonesRef.current.has(extra.stroke.id) &&
          now - extra.at < EXTRA_TTL_MS &&
          extra.page < base.length
      );

      let doc = documentFrom(base, 0);
      const seen = new Set(serverIds);
      for (const extra of extrasRef.current) {
        if (seen.has(extra.stroke.id)) continue;
        seen.add(extra.stroke.id);
        doc = applyBoardOp(doc, { type: "stroke", page: extra.page, stroke: extra.stroke });
      }
      for (const op of pendingRef.current) {
        doc = applyBoardOp(doc, op);
      }
      return doc.pages;
    },
    [documentFrom]
  );

  const adoptSnapshot = useCallback(
    (snapshot: BoardSnapshot) => {
      const incoming = pagesFromSnapshot(snapshot);
      if (!incoming || typeof snapshot.revision !== "number") return;
      if (snapshot.revision < revisionRef.current) return;
      // A slower response can still describe fewer pages than the board we are on.
      // Ignore it so adding a page does not jump back to the previous one.
      if (incoming.length < pagesRef.current.length) return;

      const next = reconcile(incoming);
      if (next.length < pagesRef.current.length) return;
      revisionRef.current = snapshot.revision;
      if (!samePages(pagesRef.current, next)) {
        pagesRef.current = next;
      }
      setPages((current) => (samePages(current, next) ? current : next));
      setActivePage(() => {
        const max = Math.max(0, pagesRef.current.length - 1);
        return Math.min(Math.max(activeRef.current, 0), max);
      });
    },
    [reconcile]
  );

  const pull = useCallback(async () => {
    const res = await fetch(`/api/classroom/${roomId}/whiteboard`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return;
    const json = (await res.json()) as BoardSnapshot;
    adoptSnapshot(json);
  }, [adoptSnapshot, roomId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!cancelled) await pull();
      } catch {
        /* live strokes still sync over the room */
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
  }, [pull]);

  useEffect(() => {
    const publish = (op: BoardOp | { type: "sync-request" }) => {
      const bytes = new TextEncoder().encode(JSON.stringify(op));
      return room.localParticipant.publishData(bytes, {
        reliable: true,
        topic: WHITEBOARD_TOPIC,
      });
    };

    const sendBoard = () => {
      pagesRef.current.forEach((strokes, page) => {
        for (const stroke of strokes) {
          void publish({ type: "stroke", page, stroke }).catch(() => undefined);
        }
      });
    };

    const onData = (
      payload: Uint8Array,
      participant?: { identity?: string },
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== WHITEBOARD_TOPIC) return;
      if (participant?.identity && participant.identity === room.localParticipant.identity) return;

      let message: unknown;
      try {
        message = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        return;
      }

      if (
        message &&
        typeof message === "object" &&
        (message as { type?: string }).type === "sync-request"
      ) {
        sendBoard();
        return;
      }

      const parsed = parseBoardOp(message);
      if (!parsed) return;

      if (parsed.type === "stroke") {
        if (tombstonesRef.current.has(parsed.stroke.id)) return;
        if (!extrasRef.current.some((extra) => extra.stroke.id === parsed.stroke.id)) {
          extrasRef.current.push({ page: parsed.page, stroke: parsed.stroke, at: Date.now() });
        }
      } else if (parsed.type === "undo") {
        tombstonesRef.current.add(parsed.id);
        extrasRef.current = extrasRef.current.filter((extra) => extra.stroke.id !== parsed.id);
      } else if (parsed.type === "clear") {
        for (const stroke of pagesRef.current[parsed.page] ?? []) {
          tombstonesRef.current.add(stroke.id);
        }
        extrasRef.current = extrasRef.current.filter((extra) => extra.page !== parsed.page);
      }

      const next = applyBoardOp(documentFrom(pagesRef.current), parsed);
      pagesRef.current = next.pages;
      setPages(next.pages);
    };

    const requestSync = () => {
      void publish({ type: "sync-request" }).catch(() => undefined);
    };

    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantConnected, sendBoard);
    room.on(RoomEvent.Connected, requestSync);
    if (room.state === "connected") requestSync();

    return () => {
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.ParticipantConnected, sendBoard);
      room.off(RoomEvent.Connected, requestSync);
    };
  }, [documentFrom, room]);

  const commit = useCallback(
    async (op: BoardOp) => {
      if (op.type === "undo") tombstonesRef.current.add(op.id);
      if (op.type === "clear") {
        for (const stroke of pagesRef.current[op.page] ?? []) tombstonesRef.current.add(stroke.id);
      }

      pendingRef.current = [...pendingRef.current, op];
      const next = applyBoardOp(documentFrom(pagesRef.current), op);
      pagesRef.current = next.pages;
      activeRef.current = next.activePage;
      setPages(next.pages);
      setActivePage(next.activePage);

      try {
        const bytes = new TextEncoder().encode(JSON.stringify(op));
        await room.localParticipant.publishData(bytes, {
          reliable: true,
          topic: WHITEBOARD_TOPIC,
        });
      } catch (error) {
        console.warn("Whiteboard live update failed", error);
      }

      try {
        const res = await fetch(`/api/classroom/${roomId}/whiteboard`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op),
        });
        const json = (await res.json().catch(() => null)) as BoardSnapshot | null;
        if (!res.ok || !json) {
          throw new Error("Could not save whiteboard");
        }
        const index = pendingRef.current.indexOf(op);
        if (index >= 0) pendingRef.current.splice(index, 1);
        adoptSnapshot(json);
      } catch (error) {
        console.warn("Whiteboard sync failed", error);
      }
    },
    [adoptSnapshot, documentFrom, room, roomId]
  );

  const selectPage = useCallback((page: number) => {
    setActivePage((current) => {
      const next = Math.min(Math.max(page, 0), Math.max(0, pagesRef.current.length - 1));
      activeRef.current = next;
      return next === current ? current : next;
    });
  }, []);

  return {
    pages,
    activePage,
    selectPage,
    commit,
    authorId: room.localParticipant.identity,
  };
}
