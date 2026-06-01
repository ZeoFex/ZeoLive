"use client";

import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import {
  Loader2,
  LogOut,
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
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
  containerRef,
  className,
}: ControlsProps) {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const [screenShareBusy, setScreenShareBusy] = useState(false);

  const isConnected = room.state === ConnectionState.Connected;

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
        disabled={!isConnected}
        aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
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
