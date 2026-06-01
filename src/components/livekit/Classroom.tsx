"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/livekit/ChatPanel";
import { Controls } from "@/components/livekit/Controls";
import { ParticipantGrid } from "@/components/livekit/ParticipantGrid";
import { ClassroomLayoutProvider, useClassroomLayout } from "@/components/livekit/classroom-layout-context";
import { SessionHeader } from "@/components/livekit/SessionHeader";
import { WaitingRoom } from "@/components/livekit/WaitingRoom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessionPresence } from "@/hooks/useSessionPresence";
import type { ClassroomRole } from "@/lib/livekit";
import { SCREEN_SHARE_PUBLISH } from "@/lib/livekit-screen-share";
import { parseParticipantRole } from "@/lib/classroom-participant";
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
          const role = parseParticipantRole(p.metadata);
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

function ClassroomRoomInner({
  session,
  onSessionEnded,
}: {
  session: ClassroomSessionInfo;
  onSessionEnded: () => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isScreenSharing, screenExpanded } = useClassroomLayout();
  const mobilePanelsCollapsed = useRef(false);

  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [ended, setEnded] = useState(false);

  const { showWaitingRoom, isReconnecting, isConnected } = useSessionPresence(
    session.participantRole
  );

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setShowChat(false);
    }
  }, []);

  useEffect(() => {
    if (!isScreenSharing || mobilePanelsCollapsed.current) return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      mobilePanelsCollapsed.current = true;
      setShowChat(false);
      setShowParticipants(false);
    }
  }, [isScreenSharing]);

  useEffect(() => {
    if (screenExpanded && window.matchMedia("(max-width: 1023px)").matches) {
      setShowChat(false);
      setShowParticipants(false);
    }
  }, [screenExpanded]);

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

  const showSidePanel = showParticipants || showChat;

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <SessionHeader
        title={session.title}
        subject={session.subject}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
      />

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row",
          isScreenSharing && "max-md:flex-col"
        )}
      >
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showWaitingRoom ? (
            <WaitingRoom />
          ) : (
            <ParticipantGrid className="min-h-0 flex-1" />
          )}
        </main>

        {showSidePanel && (
          <div
            className={cn(
              "flex shrink-0 flex-col border-t border-border bg-background md:border-l md:border-t-0",
              isScreenSharing
                ? "max-md:max-h-[36dvh] max-md:w-full"
                : "max-md:max-h-[42dvh] md:w-80 md:max-w-[min(100%,22rem)] lg:w-96 md:max-h-none"
            )}
          >
            {showParticipants && <ParticipantsSidebar open={showParticipants} />}
            {showChat && (
              <ChatPanel
                roomId={session.roomId}
                className={cn(
                  "min-h-[160px] flex-1",
                  isScreenSharing && "max-md:max-h-[28dvh]"
                )}
              />
            )}
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

function ClassroomRoom({
  session,
  onSessionEnded,
}: {
  session: ClassroomSessionInfo;
  onSessionEnded: () => void;
}) {
  return (
    <ClassroomLayoutProvider>
      <ClassroomRoomInner session={session} onSessionEnded={onSessionEnded} />
    </ClassroomLayoutProvider>
  );
}

export function Classroom({ token, serverUrl, session }: ClassroomProps) {
  const [sessionEnded, setSessionEnded] = useState(false);

  return (
    <LiveKitRoom
      key={session.roomId}
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video
      className="flex h-[100dvh] flex-col bg-background text-foreground"
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: SCREEN_SHARE_PUBLISH,
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
        if (error.message?.includes("engine not connected")) {
          return;
        }
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
