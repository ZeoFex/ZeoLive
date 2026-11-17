"use client";

import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, LocalTrackPublication, ParticipantEvent, Track } from "livekit-client";
import {
  Circle,
  Ellipsis,
  Flag,
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
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useFloor } from "@/components/livekit/floor-control";
import { ReportDialog } from "@/components/livekit/ReportDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClassroomRole } from "@/lib/livekit";
import { isExpectedMediaIssue, mediaDeviceMessage } from "@/lib/media-device-error";
import {
  SCREEN_SHARE_CAPTURE,
  SCREEN_SHARE_PUBLISH,
} from "@/lib/livekit-screen-share";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  joinWithVideo?: boolean;
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
  joinWithVideo = false,
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [micLocked, setMicLocked] = useState(false);
  const [reportOpener, setReportOpener] = useState<(() => void) | null>(null);
  const isPhone = useMediaQuery("(max-width: 767px)");
  const lastMicSeq = useRef<number | null>(null);
  const micLockedRef = useRef(false);
  const floor = useFloor();
  const screenAllowed =
    role === "tutor" || floor.screen?.identity === localParticipant.identity;
  const screenPending = role === "student" && floor.pending("screen");

  const isConnected = room.state === ConnectionState.Connected;
  const bindReport = useCallback((open: (() => void) | null) => {
    setReportOpener(() => open);
  }, []);

  useEffect(() => {
    if (!isPhone) setMoreOpen(false);
  }, [isPhone]);

  useEffect(() => {
    if (role === "tutor" || screenAllowed) return;
    if (!localParticipant.isScreenShareEnabled) return;
    void localParticipant.setScreenShareEnabled(false);
  }, [localParticipant, role, screenAllowed]);

  const applyMic = useCallback(
    async (enabled: boolean) => {
      const publication = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (publication instanceof LocalTrackPublication) {
        if (enabled) await publication.unmute();
        else await publication.mute();
        if (enabled && publication.isMuted) {
          await localParticipant.setMicrophoneEnabled(true);
        }
        return;
      }
      await localParticipant.setMicrophoneEnabled(enabled);
    },
    [localParticipant]
  );

  useEffect(() => {
    const sync = () => {
      let locked = false;
      let seq = 0;
      try {
        const data = JSON.parse(localParticipant.metadata || "{}") as {
          micLocked?: boolean;
          micSeq?: number;
        };
        locked = data.micLocked === true;
        seq = typeof data.micSeq === "number" ? data.micSeq : 0;
      } catch {
        locked = false;
      }
      micLockedRef.current = locked;
      setMicLocked(locked);
      const previous = lastMicSeq.current;
      lastMicSeq.current = seq;
      const hostChangedMic = previous !== null && previous !== seq;
      if (locked) {
        void applyMic(false).catch(() => undefined);
        if (hostChangedMic) toast.message("The host muted your microphone");
        return;
      }
      if (!hostChangedMic) return;
      void (async () => {
        try {
          await applyMic(true);
          if (joinWithVideo) await localParticipant.setCameraEnabled(true);
          toast.message("Your microphone is on");
        } catch (error) {
          const message = mediaDeviceMessage(error, "microphone");
          if (isExpectedMediaIssue(error)) toast.message(message);
          else toast.error(message);
        }
      })();
    };

    const keepHostMute = () => {
      if (!micLockedRef.current) return;
      void applyMic(false).catch(() => undefined);
    };

    sync();
    localParticipant.on(ParticipantEvent.ParticipantMetadataChanged, sync);
    localParticipant.on(ParticipantEvent.ParticipantPermissionsChanged, sync);
    localParticipant.on(ParticipantEvent.TrackUnmuted, keepHostMute);
    return () => {
      localParticipant.off(ParticipantEvent.ParticipantMetadataChanged, sync);
      localParticipant.off(ParticipantEvent.ParticipantPermissionsChanged, sync);
      localParticipant.off(ParticipantEvent.TrackUnmuted, keepHostMute);
    };
  }, [applyMic, joinWithVideo, localParticipant]);

  const toggleMic = async () => {
    if (micLockedRef.current) return;
    try {
      await applyMic(!isMicrophoneEnabled);
    } catch (e) {
      const message = mediaDeviceMessage(e, "microphone");
      if (isExpectedMediaIssue(e)) toast.message(message);
      else toast.error(message);
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {
      const message = mediaDeviceMessage(e, "camera");
      if (isExpectedMediaIssue(e)) toast.message(message);
      else toast.error(message);
    }
  };

  const toggleScreenShare = async () => {
    if (role === "student" && !screenAllowed) {
      setScreenShareBusy(true);
      try {
        if (screenPending) {
          await floor.cancel("screen");
          toast.message("Screen share request cancelled");
        } else {
          await floor.request("screen");
          toast.message("Waiting for your tutor to allow screen sharing");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not ask to share your screen");
      } finally {
        setScreenShareBusy(false);
      }
      return;
    }

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
        toast.success(
          role === "tutor"
            ? "Sharing your screen — students see it in the main view"
            : "Sharing your screen — the class can see it"
        );
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

  const closeMore = () => setMoreOpen(false);
  const askToLeave = () => {
    if (role === "student") {
      setLeaveOpen(true);
      return;
    }
    onLeave();
  };

  const moreItems: Array<{
    key: string;
    label: string;
    pressed?: boolean;
    disabled?: boolean;
    icon: ReactNode;
    onClick: () => void;
  }> = [];

  moreItems.push({
    key: "screen",
    label: isScreenShareEnabled
      ? "Stop share"
      : screenPending
        ? "Waiting"
        : screenAllowed
          ? "Share"
          : "Ask to share",
    pressed: isScreenShareEnabled || screenPending,
    disabled: !isConnected || screenShareBusy,
    icon: screenShareBusy ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : isScreenShareEnabled ? (
      <MonitorOff className="h-5 w-5" />
    ) : (
      <Monitor className="h-5 w-5" />
    ),
    onClick: () => {
      closeMore();
      void toggleScreenShare();
    },
  });

  if (onToggleWhiteboard) {
    moreItems.push({
      key: "board",
      label: showWhiteboard ? "Hide board" : "Share board",
      pressed: showWhiteboard,
      icon: <PenLine className="h-5 w-5" />,
      onClick: () => {
        closeMore();
        onToggleWhiteboard();
      },
    });
  }

  moreItems.push({
    key: "people",
    label: "People",
    pressed: showParticipants,
    icon: <Users className="h-5 w-5" />,
    onClick: () => {
      closeMore();
      onToggleParticipants();
    },
  });

  if (canRecord && onToggleRecording) {
    moreItems.push({
      key: "record",
      label: recording ? `Stop ${formatElapsed(recordingElapsed)}` : "Record",
      pressed: recording,
      disabled: !isConnected || recordingBusy,
      icon: recordingBusy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : recording ? (
        <Square className="h-5 w-5 fill-current" />
      ) : (
        <Circle className="h-5 w-5 fill-red-500 text-red-500" />
      ),
      onClick: () => {
        closeMore();
        onToggleRecording();
      },
    });
  }

  moreItems.push({
    key: "report",
    label: "Report",
    icon: <Flag className="h-5 w-5" />,
    onClick: () => {
      closeMore();
      reportOpener?.();
    },
  });

  const moreHasLiveAction =
    isScreenShareEnabled || Boolean(recording) || Boolean(showWhiteboard) || screenPending;

  return (
    <div className={cn("relative z-30", className)}>
      {isPhone && moreOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/45"
          aria-label="Close more controls"
          onClick={closeMore}
        />
      )}

      {isPhone && moreOpen && (
        <div
          className="absolute inset-x-2 bottom-[calc(100%+0.5rem)] z-40 rounded-3xl border border-border bg-card p-3 shadow-2xl"
          style={{ animation: "zeolive-sheet-up 180ms ease-out" }}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <p className="mb-2 px-1 text-center text-xs font-medium text-muted-foreground">
            More controls
          </p>
          <div className="grid grid-cols-4 gap-1">
            {moreItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={item.disabled}
                  aria-pressed={item.pressed}
                  className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-[11px] font-medium text-foreground active:bg-muted disabled:opacity-50"
                  onClick={item.onClick}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      item.pressed
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                      item.key === "record" && item.pressed && "bg-destructive text-destructive-foreground"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="line-clamp-2 max-w-full leading-tight">{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

    <div
      className={cn(
        "relative z-30 flex flex-nowrap items-center justify-center gap-1.5 border-t border-border bg-card/95 px-2.5 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:gap-2 sm:px-4 sm:py-3 md:flex-wrap"
      )}
    >
      <Button
        type="button"
        size="icon"
        variant={isMicrophoneEnabled ? "secondary" : "destructive"}
        className="h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12"
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
        className="h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={toggleCamera}
        disabled={!isConnected}
        aria-label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      <Button
        type="button"
        size={role === "student" && !isScreenShareEnabled ? "default" : "icon"}
        variant={isScreenShareEnabled ? "default" : screenPending ? "outline" : "secondary"}
        className={cn(
          "hidden h-11 shrink-0 rounded-full sm:h-12 md:inline-flex",
          role === "student" && !isScreenShareEnabled ? "px-3" : "w-11 sm:w-12",
          isScreenShareEnabled && "ring-2 ring-emerald-400 ring-offset-2",
          role === "student" && screenAllowed && !isScreenShareEnabled && "ring-2 ring-amber-400 ring-offset-2"
        )}
        onClick={toggleScreenShare}
        disabled={!isConnected || screenShareBusy}
        aria-label={
          isScreenShareEnabled
            ? "Stop screen share"
            : screenPending
              ? "Cancel screen share request"
              : screenAllowed
                ? "Share screen"
                : "Ask to share your screen"
        }
        aria-pressed={isScreenShareEnabled || screenPending}
      >
        {screenShareBusy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isScreenShareEnabled ? (
          <MonitorOff className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
        {role === "student" && !isScreenShareEnabled && (
          <span className="ml-2 text-sm">
            {screenPending ? "Waiting" : screenAllowed ? "Share" : "Ask to share"}
          </span>
        )}
      </Button>

      {canRecord && onToggleRecording && (
        <Button
          type="button"
          variant={recording ? "destructive" : "secondary"}
          className={cn(
            "hidden h-11 shrink-0 rounded-full px-3 sm:h-12 md:inline-flex",
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
          className="hidden h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12 md:inline-flex"
          onClick={onToggleWhiteboard}
          aria-label={showWhiteboard ? "Hide whiteboard" : "Share whiteboard with the class"}
          aria-pressed={showWhiteboard}
        >
          <PenLine className="h-5 w-5" />
        </Button>
      )}

      <Button
        type="button"
        size="icon"
        variant={showChat ? "default" : "secondary"}
        className="h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={onToggleChat}
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <ReportDialog roomId={roomId} hideTrigger onBindOpen={bindReport} />

      <Button
        type="button"
        size="icon"
        variant={showParticipants ? "default" : "secondary"}
        className="h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12"
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

      <Button
        type="button"
        size="icon"
        variant={moreOpen ? "default" : "secondary"}
        className={cn(
          "relative h-10 w-10 shrink-0 rounded-full md:hidden",
          moreHasLiveAction && !moreOpen && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => setMoreOpen((open) => !open)}
        aria-expanded={moreOpen}
        aria-label={moreOpen ? "Hide more controls" : "More controls"}
      >
        <Ellipsis className="h-5 w-5" />
      </Button>

      <div className="mx-1 hidden h-8 w-px bg-border md:block" />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full md:hidden"
        onClick={askToLeave}
        aria-label="Leave"
      >
        <LogOut className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden rounded-full md:inline-flex"
        onClick={askToLeave}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Leave
      </Button>

      {role === "tutor" && onEndSession && (
        <>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full md:hidden"
            onClick={onEndSession}
            aria-label="End meeting"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="hidden rounded-full md:inline-flex"
            onClick={onEndSession}
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End meeting
          </Button>
        </>
      )}
    </div>
    <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave this meeting?</DialogTitle>
          <DialogDescription>
            You can rejoin until the tutor ends it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setLeaveOpen(false)}>
            No
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setLeaveOpen(false);
              onLeave();
            }}
          >
            Yes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
