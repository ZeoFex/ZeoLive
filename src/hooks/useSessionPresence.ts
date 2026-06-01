"use client";

import { useMemo } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import type { ClassroomRole } from "@/lib/livekit";
import { ConnectionState } from "livekit-client";

function parseRole(metadata?: string): ClassroomRole | null {
  if (!metadata) return null;
  try {
    const data = JSON.parse(metadata) as { role?: string };
    if (data.role === "tutor" || data.role === "student") return data.role;
  } catch {
    return null;
  }
  return null;
}

export function useSessionPresence(localRole: ClassroomRole | null) {
  const room = useRoomContext();
  const participants = useParticipants();

  const connectionState = room?.state ?? ConnectionState.Disconnected;
  const isConnected = connectionState === ConnectionState.Connected;
  const isReconnecting =
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting;

  const tutorPresent = useMemo(
    () => participants.some((p) => parseRole(p.metadata) === "tutor"),
    [participants]
  );

  const studentPresent = useMemo(
    () => participants.some((p) => parseRole(p.metadata) === "student"),
    [participants]
  );

  const participantCount = participants.length;

  const showWaitingRoom =
    localRole === "student" && isConnected && !tutorPresent;

  return {
    connectionState,
    isConnected,
    isReconnecting,
    tutorPresent,
    studentPresent,
    participantCount,
    showWaitingRoom,
    participants,
  };
}
