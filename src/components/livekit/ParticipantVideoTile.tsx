"use client";

import {
  ParticipantTile,
  useLocalParticipant,
  useRoomContext,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Mic, MicOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  parseParticipantRole,
  participantLabel,
} from "@/lib/classroom-participant";

interface ParticipantVideoTileProps {
  trackRef: TrackReferenceOrPlaceholder;
  variant?: "grid" | "filmstrip" | "dock" | "fill";
  className?: string;
}

export function ParticipantVideoTile({
  trackRef,
  variant = "grid",
  className,
}: ParticipantVideoTileProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const role = parseParticipantRole(trackRef.participant.metadata);
  const name = participantLabel(trackRef.participant);
  const isFilmstrip = variant === "filmstrip";
  const isDock = variant === "dock";
  const isFill = variant === "fill";
  const host = parseParticipantRole(localParticipant.metadata) === "tutor";
  const canModerate = host && !trackRef.participant.isLocal && role !== "tutor";
  const micOn = trackRef.participant.isMicrophoneEnabled;
  const [pending, setPending] = useState(false);

  const moderateMic = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/classroom/${room.name}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          identity: trackRef.participant.identity,
          action: micOn ? "mute" : "unmute",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Could not update that microphone");
      }
      toast.success(micOn ? "Microphone muted" : "Microphone unmuted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update that microphone");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-900",
        isDock &&
          "aspect-video w-full shrink-0 rounded-lg border border-white/15 shadow-md",
        isFilmstrip &&
          "h-24 w-36 shrink-0 snap-center rounded-xl border border-white/15 shadow-lg sm:h-28 sm:w-44 md:h-32 md:w-52",
        variant === "grid" &&
          "aspect-video w-full rounded-2xl border border-border bg-muted shadow-sm",
        isFill &&
          "h-full min-h-0 w-full rounded-2xl border border-white/10 bg-slate-900 shadow-md",
        className
      )}
    >
      <ParticipantTile
        trackRef={trackRef}
        className="lk-participant-tile h-full w-full [&_.lk-participant-placeholder]:bg-slate-800 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />
      <div
        className={cn(
          "pointer-events-none absolute z-10 flex items-center gap-1.5 bg-black/60 text-white backdrop-blur-sm",
          isFilmstrip
            ? "bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] rounded-md px-1.5 py-0.5 text-[10px]"
            : isFill
              ? "bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-lg px-2 py-1 text-xs"
              : "bottom-3 left-3 rounded-lg px-3 py-1.5 text-sm"
        )}
      >
        <span
          className={cn(
            "truncate font-medium",
            (isFilmstrip || isDock) && "max-w-[4.5rem] sm:max-w-[5.5rem]",
            isFill && "max-w-[9rem]"
          )}
        >
          {name}
        </span>
        {role && (
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 capitalize text-white/90",
              isDock || isFilmstrip ? "px-1 py-0 text-[8px]" : "text-[10px]"
            )}
          >
            {role}
          </Badge>
        )}
      </div>
      {canModerate ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => void moderateMic()}
          className={cn(
            "absolute right-1.5 top-1.5 z-20 flex items-center justify-center rounded-full bg-black/70 text-white shadow-md disabled:opacity-60",
            isFilmstrip || isDock ? "h-7 w-7" : "h-10 w-10"
          )}
          aria-label={micOn ? `Mute ${name}` : `Unmute ${name}`}
        >
          {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}
