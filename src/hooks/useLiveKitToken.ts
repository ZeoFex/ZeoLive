"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClassroomRole } from "@/lib/livekit";

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

  if (!json.token || !json.serverUrl) {
    throw new Error("Invalid token response from server");
  }

  return {
    token: json.token as string,
    serverUrl: json.serverUrl as string,
  };
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
