"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, DisconnectReason, RoomEvent } from "livekit-client";
import { Mic, MicOff, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/livekit/ChatPanel";
import { Controls } from "@/components/livekit/Controls";
import { ParticipantGrid } from "@/components/livekit/ParticipantGrid";
import { ScreenShareStage } from "@/components/livekit/ScreenShareStage";
import { Whiteboard } from "@/components/livekit/Whiteboard";
import { ClassroomLayoutProvider, useClassroomLayout } from "@/components/livekit/classroom-layout-context";
import { SessionHeader } from "@/components/livekit/SessionHeader";
import { WaitingRoom } from "@/components/livekit/WaitingRoom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClassroomRecorder } from "@/hooks/useClassroomRecorder";
import { useSessionPresence } from "@/hooks/useSessionPresence";
import type { ClassroomRole } from "@/lib/livekit";
import { SCREEN_SHARE_PUBLISH } from "@/lib/livekit-screen-share";
import { parseParticipantRole } from "@/lib/classroom-participant";
import { dashboardForRole, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface ClassroomSessionInfo {
  roomId: string;
  title: string;
  subject?: string | null;
  status: string;
  participantRole: ClassroomRole;
  guest?: boolean;
  shareable?: boolean;
}

interface ClassroomProps {
  token: string;
  serverUrl: string;
  session: ClassroomSessionInfo;
  audio?: boolean;
  video?: boolean;
}

function ParticipantsSidebar({
  open,
  roomId,
  isHost,
}: {
  open: boolean;
  roomId: string;
  isHost: boolean;
}) {
  const participants = useParticipants();
  const [pending, setPending] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  if (!open) return null;

  async function moderate(identity: string, action: "mute" | "unmute" | "remove") {
    setPending(identity + action);
    try {
      const res = await fetch(`/api/classroom/${roomId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ identity, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Could not update that person");
      }
      if (action === "remove") {
        toast.success("Removed from the meeting");
        setConfirmRemove(null);
      } else {
        toast.success(action === "mute" ? "Microphone muted" : "Microphone allowed again");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update that person");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="border-b border-border p-4 md:border-b-0 md:border-l">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Participants ({participants.length})
      </h3>
      <ul className="space-y-3">
        {participants.map((p) => {
          const role = parseParticipantRole(p.metadata);
          const micOn = p.isMicrophoneEnabled;
          const canModerate = isHost && !p.isLocal && role !== "tutor";
          return (
            <li key={p.sid} className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(p.name ?? p.identity).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name ?? p.identity}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  {role && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {p.identity.startsWith("guest:") ? "Guest" : role}
                    </Badge>
                  )}
                  {micOn ? (
                    <Mic className="h-3.5 w-3.5 text-muted-foreground" aria-label="Microphone on" />
                  ) : (
                    <MicOff className="h-3.5 w-3.5 text-muted-foreground" aria-label="Microphone off" />
                  )}
                </div>
                {canModerate ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-full px-2 text-xs"
                      disabled={pending !== null}
                      onClick={() => void moderate(p.identity, micOn ? "mute" : "unmute")}
                    >
                      {micOn ? "Mute" : "Unmute"}
                    </Button>
                    {confirmRemove === p.identity ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-7 rounded-full px-2 text-xs"
                        disabled={pending !== null}
                        onClick={() => void moderate(p.identity, "remove")}
                      >
                        Confirm remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2 text-xs"
                        onClick={() => setConfirmRemove(p.identity)}
                      >
                        <UserMinus className="mr-1 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                ) : null}
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
  publishAudio,
  publishVideo,
  onSessionEnded,
}: {
  session: ClassroomSessionInfo;
  publishAudio: boolean;
  publishVideo: boolean;
  onSessionEnded: () => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isScreenSharing, screenExpanded, setScreenExpanded } = useClassroomLayout();
  const mobilePanelsCollapsed = useRef(false);

  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [boardOn, setBoardOn] = useState(true);
  const [ended, setEnded] = useState(false);
  const saveWhiteboardRef = useRef<(() => Promise<void>) | null>(null);
  const bindWhiteboardSave = useCallback((save: (() => Promise<void>) | null) => {
    saveWhiteboardRef.current = save;
  }, []);

  const room = useRoomContext();
  const { showWaitingRoom, isReconnecting, isConnected, studentPresent } = useSessionPresence(
    session.participantRole
  );
  const recorder = useClassroomRecorder({
    roomId: session.roomId,
    rootRef: containerRef,
    enabled: session.participantRole === "tutor",
  });

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setShowChat(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const publishChosenDevices = async () => {
      if (room.state !== ConnectionState.Connected || cancelled) return;
      try {
        await room.localParticipant.setMicrophoneEnabled(publishAudio);
      } catch (error) {
        if (!cancelled && publishAudio) {
          toast.error(error instanceof Error ? error.message : "Could not turn the microphone on");
        }
      }
      try {
        await room.localParticipant.setCameraEnabled(publishVideo);
      } catch (error) {
        if (!cancelled && publishVideo) {
          toast.error(error instanceof Error ? error.message : "Could not turn the camera on");
        }
      }
    };
    void publishChosenDevices();
    room.on(RoomEvent.Connected, publishChosenDevices);
    return () => {
      cancelled = true;
      room.off(RoomEvent.Connected, publishChosenDevices);
    };
  }, [publishAudio, publishVideo, room]);

  useEffect(() => {
    if (session.participantRole === "tutor" && studentPresent) {
      setShowParticipants(true);
    }
  }, [session.participantRole, studentPresent]);

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

  const leaveRoom = useCallback(async () => {
    try {
      await recorder.stopAndSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the recording");
    }
    const path = session.guest
      ? `/join/${session.roomId}`
      : session.participantRole === "tutor"
        ? dashboardForRole("TUTOR")
        : dashboardForRole("STUDENT");
    router.push(path);
  }, [recorder, router, session.guest, session.participantRole]);

  const openEndedMeetings = useCallback(() => {
    router.push(session.shareable ? routes.tutor.scheduling : routes.tutor.sessions);
  }, [router, session.shareable]);

  const endSession = useCallback(async () => {
    try {
      await recorder.stopAndSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the recording");
    }
    try {
      await saveWhiteboardRef.current?.();
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
      openEndedMeetings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not end session");
    }
  }, [session.roomId, openEndedMeetings, onSessionEnded, recorder]);

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
  const whiteboardVisible = boardOn && !(isScreenSharing && screenExpanded);

  const toggleWhiteboard = () => {
    if (whiteboardVisible) {
      setBoardOn(false);
      return;
    }
    setBoardOn(true);
    setScreenExpanded(false);
  };

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <SessionHeader
        title={session.title}
        subject={session.subject}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        recording={recorder.recording}
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
          ) : whiteboardVisible ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 md:flex-row md:p-3">
                <Whiteboard
                  roomId={session.roomId}
                  role={session.participantRole}
                  onBindSave={bindWhiteboardSave}
                />
                {isScreenSharing && <ScreenShareStage layout="side" />}
              </div>
              <ParticipantGrid variant="filmstrip" />
            </div>
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
            {showParticipants && (
              <ParticipantsSidebar
                open={showParticipants}
                roomId={session.roomId}
                isHost={session.participantRole === "tutor"}
              />
            )}
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
        roomId={session.roomId}
        role={session.participantRole}
        onLeave={leaveRoom}
        onEndSession={session.participantRole === "tutor" ? endSession : undefined}
        showChat={showChat}
        onToggleChat={() => setShowChat((v) => !v)}
        showParticipants={showParticipants}
        onToggleParticipants={() => setShowParticipants((v) => !v)}
        showWhiteboard={!showWaitingRoom && whiteboardVisible}
        onToggleWhiteboard={showWaitingRoom ? undefined : toggleWhiteboard}
        containerRef={containerRef}
        canRecord={session.participantRole === "tutor"}
        recording={recorder.recording}
        recordingBusy={recorder.busy}
        recordingElapsed={recorder.elapsedSeconds}
        onToggleRecording={() => void recorder.toggle()}
      />
    </div>
  );
}

function ClassroomRoom({
  session,
  publishAudio,
  publishVideo,
  onSessionEnded,
}: {
  session: ClassroomSessionInfo;
  publishAudio: boolean;
  publishVideo: boolean;
  onSessionEnded: () => void;
}) {
  return (
    <ClassroomLayoutProvider>
      <ClassroomRoomInner
        session={session}
        publishAudio={publishAudio}
        publishVideo={publishVideo}
        onSessionEnded={onSessionEnded}
      />
    </ClassroomLayoutProvider>
  );
}

export function Classroom({
  token,
  serverUrl,
  session,
  audio = true,
  video = true,
}: ClassroomProps) {
  const [sessionEnded, setSessionEnded] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
        <h1 className="text-lg font-semibold">You were removed from the meeting</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The host removed you from this meeting.
        </p>
        <Button asChild>
          <a href="/">Back home</a>
        </Button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={session.roomId}
      token={token}
      serverUrl={serverUrl}
      connect
      audio={audio}
      video={video}
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
        if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
          setRemoved(true);
          return;
        }
        if (sessionEnded) {
          return;
        }
        if (session.guest) {
          window.location.assign(`/join/${session.roomId}`);
          return;
        }
        if (reason === DisconnectReason.ROOM_DELETED) {
          setSessionEnded(true);
          toast.message("The tutor ended the meeting");
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
        publishAudio={audio}
        publishVideo={video}
        onSessionEnded={() => setSessionEnded(true)}
      />
    </LiveKitRoom>
  );
}
