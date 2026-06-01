"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClassroomRole } from "@/lib/livekit";

export type LiveKitTokenState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; token: string; serverUrl: string }
  | { status: "error"; message: string };

export function useLiveKitToken(roomId: string | null, role: ClassroomRole | null) {
  const [state, setState] = useState<LiveKitTokenState>({ status: "idle" });

  const fetchToken = useCallback(async () => {
    if (!roomId || !role) return;

    setState({ status: "loading" });
    try {
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

      setState({
        status: "ready",
        token: json.token as string,
        serverUrl: json.serverUrl as string,
      });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Could not join session",
      });
    }
  }, [roomId, role]);

  useEffect(() => {
    if (roomId && role) {
      void fetchToken();
    }
  }, [roomId, role, fetchToken]);

  return { state, refetch: fetchToken };
}
