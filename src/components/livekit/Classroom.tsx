"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useAudioPlayback,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, DisconnectReason, RoomEvent } from "livekit-client";
import { Mic, MicOff, UserMinus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/livekit/ChatPanel";
import { Controls } from "@/components/livekit/Controls";
import { ParticipantGrid } from "@/components/livekit/ParticipantGrid";
import { ScreenShareStage } from "@/components/livekit/ScreenShareStage";
import { Whiteboard } from "@/components/livekit/Whiteboard";
import { ClassroomLayoutProvider, useClassroomLayout } from "@/components/livekit/classroom-layout-context";
import { FloorProvider, FloorRequestBanner, useFloor } from "@/components/livekit/floor-control";
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
import {
  isExpectedMediaIssue,
  listedDeviceAvailable,
  mediaDeviceMessage,
} from "@/lib/media-device-error";
import { BRAND_NAME } from "@/lib/brand";
import { dashboardForRole } from "@/lib/routes";
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
  const floor = useFloor();
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
                  {floor.screen?.identity === p.identity && (
                    <Badge variant="outline" className="text-[10px]">
                      Screen
                    </Badge>
                  )}
                  {floor.board?.identity === p.identity && (
                    <Badge variant="outline" className="text-[10px]">
                      Drawing
                    </Badge>
                  )}
                </div>
                {canModerate ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {floor.requests.some((request) => request.identity === p.identity && request.kind === "screen") && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 rounded-full px-2 text-xs"
                        disabled={floor.busy}
                        onClick={() => {
                          void floor.grant("screen", p.identity).catch((error: unknown) => {
                            toast.error(error instanceof Error ? error.message : "Could not allow screen sharing");
                          });
                        }}
                      >
                        Allow screen
                      </Button>
                    )}
                    {floor.screen?.identity === p.identity && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full px-2 text-xs"
                        disabled={floor.busy}
                        onClick={() => {
                          void floor.revoke("screen", p.identity).catch((error: unknown) => {
                            toast.error(error instanceof Error ? error.message : "Could not stop screen sharing");
                          });
                        }}
                      >
                        Stop screen
                      </Button>
                    )}
                    {floor.requests.some((request) => request.identity === p.identity && request.kind === "board") && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 rounded-full px-2 text-xs"
                        disabled={floor.busy}
                        onClick={() => {
                          void floor.grant("board", p.identity).catch((error: unknown) => {
                            toast.error(error instanceof Error ? error.message : "Could not allow drawing");
                          });
                        }}
                      >
                        Allow drawing
                      </Button>
                    )}
                    {floor.board?.identity === p.identity && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full px-2 text-xs"
                        disabled={floor.busy}
                        onClick={() => {
                          void floor.revoke("board", p.identity).catch((error: unknown) => {
                            toast.error(error instanceof Error ? error.message : "Could not take back the pen");
                          });
                        }}
                      >
                        Stop drawing
                      </Button>
                    )}
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

function GoodbyeScreen({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">Goodbye</h1>
      <p className="text-lg font-medium">Thanks for using {BRAND_NAME}</p>
      <p className="max-w-sm text-sm text-muted-foreground">This meeting has ended.</p>
      <Button className="mt-2" onClick={onLeave}>
        Leave
      </Button>
    </div>
  );
}

function ClassroomPlayback() {
  const room = useRoomContext();
  const { canPlayAudio, startAudio } = useAudioPlayback(room);

  useEffect(() => {
    void startAudio().catch(() => undefined);
  }, [startAudio]);

  useEffect(() => {
    if (canPlayAudio) return;
    const resume = () => {
      void startAudio().catch(() => undefined);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("touchend", resume);
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("touchend", resume);
    };
  }, [canPlayAudio, startAudio]);

  if (canPlayAudio) return null;

  return (
    <button
      type="button"
      className="absolute inset-x-3 bottom-[4.75rem] z-40 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
      onClick={() => void startAudio()}
    >
      Tap to hear everyone
    </button>
  );
}

function MeetingPause({
  session,
  mode,
  onRejoin,
  onExit,
}: {
  session: ClassroomSessionInfo;
  mode: "away" | "closed";
  onRejoin: () => Promise<boolean>;
  onExit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const isTutor = session.participantRole === "tutor";
  const closed = mode === "closed";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-hidden bg-background p-8 text-center text-foreground">
      <h1 className="text-xl font-semibold">
        {closed ? "This meeting has ended" : "You left the meeting"}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {closed
          ? "The tutor ended the meeting, so it is closed."
          : isTutor
            ? "Students can stay in the class. You can rejoin them until you end the meeting."
            : "You can rejoin until the tutor ends the meeting."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {closed ? null : (
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onRejoin().finally(() => setBusy(false));
            }}
          >
            {busy ? "Rejoining…" : "Rejoin"}
          </Button>
        )}
        <Button variant="outline" onClick={onExit}>
          {closed ? "Leave" : "Leave for now"}
        </Button>
      </div>
    </div>
  );
}

function ClassroomRoomInner({
  session,
  publishAudio,
  publishVideo,
  onSessionEnded,
  onLeft,
  onExit,
}: {
  session: ClassroomSessionInfo;
  publishAudio: boolean;
  publishVideo: boolean;
  onSessionEnded: () => void;
  onLeft: () => void;
  onExit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const openedMedia = useRef({ mic: false, camera: false });
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

      const openDevice = async (
        kind: "microphone" | "camera",
        enabled: boolean,
        input: "audioinput" | "videoinput"
      ) => {
        if (!enabled || cancelled) return;
        const listed = await listedDeviceAvailable(input);
        if (cancelled) return;
        if (listed === false) {
          toast.message(mediaDeviceMessage({ name: "NotFoundError" }, kind));
          return;
        }
        try {
          if (kind === "microphone") {
            await room.localParticipant.setMicrophoneEnabled(true);
          } else {
            await room.localParticipant.setCameraEnabled(true);
          }
        } catch (error) {
          if (cancelled) return;
          const message = mediaDeviceMessage(error, kind);
          if (isExpectedMediaIssue(error)) toast.message(message);
          else toast.error(message);
        }
      };

      if (publishAudio && !openedMedia.current.mic) {
        await openDevice("microphone", true, "audioinput");
        openedMedia.current.mic = room.localParticipant.isMicrophoneEnabled;
      }
      if (publishVideo && !openedMedia.current.camera) {
        await openDevice("camera", true, "videoinput");
        openedMedia.current.camera = room.localParticipant.isCameraEnabled;
      }
    };
    void publishChosenDevices();
    room.on(RoomEvent.Connected, publishChosenDevices);
    const retries = [700, 1800].map((delay) =>
      window.setTimeout(() => {
        void publishChosenDevices();
      }, delay)
    );
    return () => {
      cancelled = true;
      retries.forEach((timer) => window.clearTimeout(timer));
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
    if (session.participantRole !== "tutor") {
      void fetch(`/api/classroom/${session.roomId}/floor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        keepalive: true,
        body: JSON.stringify({ action: "release" }),
      }).catch(() => undefined);
    }
    try {
      await recorder.stopAndSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the recording");
    }
    onLeft();
  }, [onLeft, recorder, session.participantRole, session.roomId]);

  const exitClass = useCallback(() => {
    onExit();
  }, [onExit]);

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not end session");
    }
  }, [session.roomId, onSessionEnded, recorder]);

  if (ended) {
    return <GoodbyeScreen onLeave={exitClass} />;
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
    <FloorProvider roomId={session.roomId} role={session.participantRole}>
    <div ref={containerRef} className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
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
      <ClassroomPlayback />
      <FloorRequestBanner />
      <Controls
        roomId={session.roomId}
        role={session.participantRole}
        joinWithVideo={publishVideo}
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
    </FloorProvider>
  );
}

function ClassroomRoom({
  session,
  publishAudio,
  publishVideo,
  onSessionEnded,
  onLeft,
  onExit,
}: {
  session: ClassroomSessionInfo;
  publishAudio: boolean;
  publishVideo: boolean;
  onSessionEnded: () => void;
  onLeft: () => void;
  onExit: () => void;
}) {
  return (
    <ClassroomLayoutProvider>
      <ClassroomRoomInner
        session={session}
        publishAudio={publishAudio}
        publishVideo={publishVideo}
        onSessionEnded={onSessionEnded}
        onLeft={onLeft}
        onExit={onExit}
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
  onRefreshToken,
}: ClassroomProps & { onRefreshToken?: () => Promise<void> }) {
  const router = useRouter();
  const [sessionEnded, setSessionEnded] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [away, setAway] = useState(false);
  const leavingRef = useRef(false);

  const exitClass = useCallback(() => {
    const path = session.guest
      ? "/"
      : session.participantRole === "tutor"
        ? dashboardForRole("TUTOR")
        : dashboardForRole("STUDENT");
    router.push(path);
  }, [router, session.guest, session.participantRole]);

  const meetingIsClosed = useCallback(async () => {
    const res = await fetch(`/api/classroom/${session.roomId}`, { credentials: "same-origin" });
    const json = await res.json().catch(() => ({}));
    const status = typeof json.status === "string" ? json.status : "";
    return !res.ok || status === "COMPLETED" || status === "CANCELLED";
  }, [session.roomId]);

  const rejoin = useCallback(async () => {
    try {
      if (await meetingIsClosed()) {
        setSessionEnded(true);
        setAway(false);
        return false;
      }
      await onRefreshToken?.();
      setAway(false);
      return true;
    } catch {
      toast.message("Could not rejoin yet. The meeting is still open if the tutor has not ended it.");
      return false;
    }
  }, [meetingIsClosed, onRefreshToken]);

  useEffect(() => {
    if (sessionEnded || removed) return;
    const watch = window.setInterval(() => {
      void fetch(`/api/classroom/${session.roomId}`, { credentials: "same-origin" })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          const status = typeof json.status === "string" ? json.status : "";
          if (status === "COMPLETED" || status === "CANCELLED") {
            setSessionEnded(true);
            setAway(false);
          }
        })
        .catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(watch);
  }, [removed, session.roomId, sessionEnded]);

  if (removed) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-hidden bg-background p-8 text-center text-foreground">
        <h1 className="text-lg font-semibold">You were removed from the meeting</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The host removed you from this meeting.
        </p>
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    );
  }

  if (sessionEnded) {
    return <GoodbyeScreen onLeave={exitClass} />;
  }

  if (away) {
    return <MeetingPause session={session} mode="away" onRejoin={rejoin} onExit={exitClass} />;
  }

  return (
    <LiveKitRoom
      key={session.roomId}
      token={token}
      serverUrl={serverUrl}
      connect
      audio={false}
      video={false}
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background text-foreground"
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
        if (leavingRef.current || reason === DisconnectReason.CLIENT_INITIATED || sessionEnded) {
          return;
        }
        if (reason === DisconnectReason.ROOM_DELETED) {
          setSessionEnded(true);
        }
      }}
      onError={(error) => {
        if (error.message?.includes("engine not connected") || isExpectedMediaIssue(error)) {
          return;
        }
        console.error("LiveKit room error:", error);
        const invalidAddress = error.message?.includes("Invalid URL");
        toast.error(
          invalidAddress
            ? "The class video server address is not valid, so you cannot see the tutor."
            : error.message || "Connection error"
        );
      }}
    >
      <ClassroomRoom
        session={session}
        publishAudio={audio}
        publishVideo={video}
        onSessionEnded={() => setSessionEnded(true)}
        onLeft={() => {
          leavingRef.current = true;
          setAway(true);
        }}
        onExit={exitClass}
      />
    </LiveKitRoom>
  );
}
