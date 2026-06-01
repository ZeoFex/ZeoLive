"use client";

import {
  ParticipantTile,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  parseParticipantRole,
  participantLabel,
} from "@/lib/classroom-participant";

interface ParticipantVideoTileProps {
  trackRef: TrackReferenceOrPlaceholder;
  variant?: "grid" | "filmstrip" | "dock";
  className?: string;
}

export function ParticipantVideoTile({
  trackRef,
  variant = "grid",
  className,
}: ParticipantVideoTileProps) {
  const role = parseParticipantRole(trackRef.participant.metadata);
  const name = participantLabel(trackRef.participant);
  const isFilmstrip = variant === "filmstrip";
  const isDock = variant === "dock";

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
            : "bottom-3 left-3 rounded-lg px-3 py-1.5 text-sm"
        )}
      >
        <span
          className={cn(
            "truncate font-medium",
            (isFilmstrip || isDock) && "max-w-[4.5rem] sm:max-w-[5.5rem]"
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
    </div>
  );
}
