"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClassroomRole } from "@/lib/livekit";
import { liveKitWebsocketUrl } from "@/lib/livekit-url";

export type LiveKitTokenState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; token: string; serverUrl: string }
  | { status: "error"; message: string };

async function requestLiveKitToken(roomId: string, role: ClassroomRole) {
  const res = await fetch("/api/livekit-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ room: roomId, role }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof json.error === "string" ? json.error : "Could not join session"
    );
  }

  const token = typeof json.token === "string" ? json.token : "";
  const serverUrl =
    liveKitWebsocketUrl(typeof json.serverUrl === "string" ? json.serverUrl : "") ||
    liveKitWebsocketUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL);

  if (!token || !serverUrl) {
    throw new Error(
      "This class cannot open the video room, so you cannot see the tutor. The video server address is missing or not a valid link."
    );
  }

  return { token, serverUrl };
}

export function useLiveKitToken(roomId: string | null, role: ClassroomRole | null) {
  const [state, setState] = useState<LiveKitTokenState>(() =>
    roomId && role ? { status: "loading" } : { status: "idle" }
  );

  useEffect(() => {
    if (!roomId || !role) return;

    let cancelled = false;

    void requestLiveKitToken(roomId, role)
      .then(({ token, serverUrl }) => {
        if (!cancelled) {
          setState({ status: "ready", token, serverUrl });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Could not join session",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, role]);

  const refetch = useCallback(async () => {
    if (!roomId || !role) return;
    setState({ status: "loading" });
    try {
      const { token, serverUrl } = await requestLiveKitToken(roomId, role);
      setState({ status: "ready", token, serverUrl });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Could not join session",
      });
    }
  }, [roomId, role]);

  return { state, refetch };
}
