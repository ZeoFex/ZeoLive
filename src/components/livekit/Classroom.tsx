"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/livekit/ChatPanel";
import { Controls } from "@/components/livekit/Controls";
import { ParticipantGrid } from "@/components/livekit/ParticipantGrid";
import { SessionHeader } from "@/components/livekit/SessionHeader";
import { WaitingRoom } from "@/components/livekit/WaitingRoom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessionPresence } from "@/hooks/useSessionPresence";
import type { ClassroomRole } from "@/lib/livekit";
import { dashboardForRole } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useParticipants } from "@livekit/components-react";

export interface ClassroomSessionInfo {
  roomId: string;
  title: string;
  subject?: string | null;
  status: string;
  participantRole: ClassroomRole;
}

interface ClassroomProps {
  token: string;
  serverUrl: string;
  session: ClassroomSessionInfo;
}

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

function ParticipantsSidebar({ open }: { open: boolean }) {
  const participants = useParticipants();

  if (!open) return null;

  return (
    <div className="border-b border-border p-4 md:border-b-0 md:border-l">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Participants ({participants.length})
      </h3>
      <ul className="space-y-2">
        {participants.map((p) => {
          const role = parseRole(p.metadata);
          return (
            <li key={p.sid} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(p.name ?? p.identity).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name ?? p.identity}</p>
                {role && (
                  <Badge variant="outline" className="mt-0.5 text-[10px] capitalize">
                    {role}
                  </Badge>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ClassroomRoom({
  session,
  onSessionEnded,
}: {
  session: ClassroomSessionInfo;
  onSessionEnded: () => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [ended, setEnded] = useState(false);

  const { showWaitingRoom, isReconnecting, isConnected } = useSessionPresence(
    session.participantRole
  );

  const leaveRoom = useCallback(() => {
    const path =
      session.participantRole === "tutor"
        ? dashboardForRole("TUTOR")
        : dashboardForRole("STUDENT");
    router.push(path);
  }, [router, session.participantRole]);

  const endSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/classroom/${session.roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Could not end session");
      }
      setEnded(true);
      onSessionEnded();
      toast.success("Session ended for all participants");
      leaveRoom();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not end session");
    }
  }, [session.roomId, leaveRoom, onSessionEnded]);

  if (ended) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">Session ended</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This tutoring session has been closed. You can return to your dashboard.
        </p>
        <Button onClick={leaveRoom}>Back to dashboard</Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <SessionHeader
        title={session.title}
        subject={session.subject}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <main className="flex min-h-0 flex-1 flex-col">
          {showWaitingRoom ? (
            <WaitingRoom />
          ) : (
            <ParticipantGrid className="min-h-0 flex-1" />
          )}
        </main>

        {(showParticipants || showChat) && (
          <div
            className={cn(
              "flex max-h-[40vh] flex-col border-t border-border md:max-h-none md:max-w-md md:flex-row md:border-l md:border-t-0",
              showChat && showParticipants && "md:flex-col"
            )}
          >
            {showParticipants && <ParticipantsSidebar open={showParticipants} />}
            {showChat && <ChatPanel className="min-h-[200px] flex-1" />}
          </div>
        )}
      </div>

      <RoomAudioRenderer />
      <Controls
        role={session.participantRole}
        onLeave={leaveRoom}
        onEndSession={session.participantRole === "tutor" ? endSession : undefined}
        showChat={showChat}
        onToggleChat={() => setShowChat((v) => !v)}
        showParticipants={showParticipants}
        onToggleParticipants={() => setShowParticipants((v) => !v)}
        containerRef={containerRef}
      />
    </div>
  );
}

export function Classroom({ token, serverUrl, session }: ClassroomProps) {
  const [sessionEnded, setSessionEnded] = useState(false);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      className="flex h-screen flex-col bg-background text-foreground"
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
      connectOptions={{
        autoSubscribe: true,
      }}
      onDisconnected={(reason) => {
        if (reason === DisconnectReason.PARTICIPANT_REMOVED || sessionEnded) {
          return;
        }
        if (reason === DisconnectReason.ROOM_DELETED) {
          setSessionEnded(true);
          toast.message("The session has ended");
        }
      }}
      onError={(error) => {
        console.error("LiveKit room error:", error);
        toast.error(error.message || "Connection error");
      }}
    >
      <ClassroomRoom
        session={session}
        onSessionEnded={() => setSessionEnded(true)}
      />
    </LiveKitRoom>
  );
}
