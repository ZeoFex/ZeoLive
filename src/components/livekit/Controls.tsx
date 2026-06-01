"use client";

import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import {
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
import { ConnectionState } from "livekit-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClassroomRole } from "@/lib/livekit";

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
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const isConnected = room.state === ConnectionState.Connected;

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  const toggleFullscreen = async () => {
    const el = containerRef?.current ?? document.documentElement;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 border-t border-border bg-card/80 px-4 py-3 backdrop-blur-md",
        className
      )}
    >
      <Button
        type="button"
        size="icon"
        variant={isMicrophoneEnabled ? "secondary" : "destructive"}
        className="h-12 w-12 rounded-full"
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
        className="h-12 w-12 rounded-full"
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
          className="h-12 w-12 rounded-full"
          onClick={toggleScreenShare}
          disabled={!isConnected}
          aria-label={isScreenShareEnabled ? "Stop screen share" : "Share screen"}
        >
          {isScreenShareEnabled ? (
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
        className="h-12 w-12 rounded-full"
        onClick={onToggleChat}
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        size="icon"
        variant={showParticipants ? "default" : "secondary"}
        className="h-12 w-12 rounded-full"
        onClick={onToggleParticipants}
        aria-label="Toggle participants"
      >
        <Users className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-12 w-12 rounded-full"
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen"
      >
        <Maximize className="h-5 w-5" />
      </Button>

      <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

      <Button
        type="button"
        variant="outline"
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
