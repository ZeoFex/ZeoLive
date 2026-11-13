"use client";

import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, ParticipantEvent } from "livekit-client";
import {
  Circle,
  Loader2,
  LogOut,
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PenLine,
  PhoneOff,
  Square,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/livekit/ReportDialog";
import { Button } from "@/components/ui/button";
import type { ClassroomRole } from "@/lib/livekit";
import {
  SCREEN_SHARE_CAPTURE,
  SCREEN_SHARE_PUBLISH,
} from "@/lib/livekit-screen-share";
import { cn } from "@/lib/utils";

interface ControlsProps {
  role: ClassroomRole;
  onLeave: () => void;
  onEndSession?: () => void;
  showChat: boolean;
  onToggleChat: () => void;
  showParticipants: boolean;
  onToggleParticipants: () => void;
  showWhiteboard?: boolean;
  onToggleWhiteboard?: () => void;
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  roomId: string;
  canRecord?: boolean;
  recording?: boolean;
  recordingBusy?: boolean;
  recordingElapsed?: number;
  onToggleRecording?: () => void;
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function screenShareErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Could not share your screen";
  const msg = error.message.toLowerCase();
  if (msg.includes("notallowed") || msg.includes("permission")) {
    return "Screen share was blocked. Allow screen recording in your browser settings and try again.";
  }
  if (msg.includes("notfound") || msg.includes("no display")) {
    return "No screen or window was selected.";
  }
  if (msg.includes("abort")) {
    return "Screen share was cancelled.";
  }
  return error.message || "Could not share your screen";
}

export function Controls({
  role,
  onLeave,
  onEndSession,
  showChat,
  onToggleChat,
  showParticipants,
  onToggleParticipants,
  showWhiteboard,
  onToggleWhiteboard,
  containerRef,
  className,
  roomId,
  canRecord,
  recording,
  recordingBusy,
  recordingElapsed = 0,
  onToggleRecording,
}: ControlsProps) {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const [screenShareBusy, setScreenShareBusy] = useState(false);
  const [micLocked, setMicLocked] = useState(false);
  const micLockNotice = useRef(false);

  const isConnected = room.state === ConnectionState.Connected;

  useEffect(() => {
    const sync = () => {
      let locked = false;
      try {
        const data = JSON.parse(localParticipant.metadata || "{}") as { micLocked?: boolean };
        locked = data.micLocked === true;
      } catch {
        locked = false;
      }
      setMicLocked(locked);
      if (locked) {
        if (localParticipant.isMicrophoneEnabled) {
          void localParticipant.setMicrophoneEnabled(false);
        }
        if (!micLockNotice.current) {
          micLockNotice.current = true;
          toast.message("The host muted your microphone");
        }
      } else if (micLockNotice.current) {
        micLockNotice.current = false;
        toast.message("You can turn your microphone on");
      }
    };

    sync();
    localParticipant.on(ParticipantEvent.ParticipantMetadataChanged, sync);
    localParticipant.on(ParticipantEvent.ParticipantPermissionsChanged, sync);
    return () => {
      localParticipant.off(ParticipantEvent.ParticipantMetadataChanged, sync);
      localParticipant.off(ParticipantEvent.ParticipantPermissionsChanged, sync);
    };
  }, [localParticipant]);

  const toggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not toggle microphone");
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not toggle camera");
    }
  };

  const toggleScreenShare = async () => {
    if (role !== "tutor") return;

    setScreenShareBusy(true);
    try {
      if (isScreenShareEnabled) {
        await localParticipant.setScreenShareEnabled(false);
        toast.message("Screen sharing stopped");
      } else {
        await localParticipant.setScreenShareEnabled(
          true,
          SCREEN_SHARE_CAPTURE,
          SCREEN_SHARE_PUBLISH
        );
        toast.success("Sharing your screen — students see it in the main view");
      }
    } catch (e) {
      toast.error(screenShareErrorMessage(e));
    } finally {
      setScreenShareBusy(false);
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef?.current ?? document.documentElement;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      toast.error("Fullscreen is not available on this device");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 border-t border-border bg-card/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-4",
        className
      )}
    >
      <Button
        type="button"
        size="icon"
        variant={isMicrophoneEnabled ? "secondary" : "destructive"}
        className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={toggleMic}
        disabled={!isConnected || micLocked}
        aria-label={
          micLocked
            ? "The host muted your microphone"
            : isMicrophoneEnabled
              ? "Mute microphone"
              : "Unmute microphone"
        }
      >
        {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        type="button"
        size="icon"
        variant={isCameraEnabled ? "secondary" : "destructive"}
        className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={toggleCamera}
        disabled={!isConnected}
        aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      {role === "tutor" && (
        <Button
          type="button"
          size="icon"
          variant={isScreenShareEnabled ? "default" : "secondary"}
          className={cn(
            "h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12",
            isScreenShareEnabled && "ring-2 ring-emerald-400 ring-offset-2"
          )}
          onClick={toggleScreenShare}
          disabled={!isConnected || screenShareBusy}
          aria-label={isScreenShareEnabled ? "Stop screen share" : "Share screen"}
          aria-pressed={isScreenShareEnabled}
        >
          {screenShareBusy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isScreenShareEnabled ? (
            <MonitorOff className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
        </Button>
      )}

      {canRecord && onToggleRecording && (
        <Button
          type="button"
          variant={recording ? "destructive" : "secondary"}
          className={cn(
            "h-11 shrink-0 rounded-full px-3 sm:h-12",
            recording && "animate-pulse"
          )}
          onClick={onToggleRecording}
          disabled={!isConnected || recordingBusy}
          aria-pressed={recording}
          aria-label={recording ? "Stop recording" : "Record lesson"}
        >
          {recordingBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : recording ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Circle className="h-4 w-4 fill-red-500 text-red-500" />
          )}
          <span className="ml-2 text-sm">
            {recording
              ? `Stop ${formatElapsed(recordingElapsed)}`
              : "Record"}
          </span>
        </Button>
      )}

      {onToggleWhiteboard && (
        <Button
          type="button"
          size="icon"
          variant={showWhiteboard ? "default" : "secondary"}
          className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
          onClick={onToggleWhiteboard}
          aria-label={showWhiteboard ? "Hide whiteboard" : "Show whiteboard"}
          aria-pressed={showWhiteboard}
        >
          <PenLine className="h-5 w-5" />
        </Button>
      )}

      <Button
        type="button"
        size="icon"
        variant={showChat ? "default" : "secondary"}
        className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={onToggleChat}
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <ReportDialog roomId={roomId} />

      <Button
        type="button"
        size="icon"
        variant={showParticipants ? "default" : "secondary"}
        className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={onToggleParticipants}
        aria-label="Toggle participants"
      >
        <Users className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="hidden h-11 w-11 shrink-0 rounded-full sm:inline-flex sm:h-12 sm:w-12"
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
      >
        <Maximize className="h-5 w-5" />
      </Button>

      <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={onLeave}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Leave
      </Button>

      {role === "tutor" && onEndSession && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="rounded-full"
          onClick={onEndSession}
        >
          <PhoneOff className="mr-2 h-4 w-4" />
          End session
        </Button>
      )}
    </div>
  );
}
