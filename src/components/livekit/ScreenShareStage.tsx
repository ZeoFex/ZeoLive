"use client";

import { ParticipantTile } from "@livekit/components-react";
import { Maximize2, Minimize2, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassroomLayout } from "@/components/livekit/classroom-layout-context";

interface ScreenShareStageProps {
  className?: string;
}

export function ScreenShareStage({ className }: ScreenShareStageProps) {
  const {
    isScreenSharing,
    screenTrack,
    sharerName,
    sharerRole,
    screenExpanded,
    toggleScreenExpanded,
  } = useClassroomLayout();

  if (!isScreenSharing) {
    return (
      <div className={cn("hidden", className)} aria-hidden />
    );
  }

  return (
    <div
      data-expanded={screenExpanded ? "true" : "false"}
      className={cn(
        "lk-screen-stage group relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-slate-950 md:rounded-2xl",
        screenExpanded
          ? "min-h-0 flex-1"
          : "min-h-[38dvh] flex-1 md:min-h-0",
        className
      )}
    >
      <button
        type="button"
        onClick={toggleScreenExpanded}
        className="absolute inset-0 z-[1] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        aria-label={
          screenExpanded
            ? "Exit expanded screen share view"
            : "Expand screen share to full view"
        }
      />

      {screenTrack && (
        <ParticipantTile
          key={`screen-${screenTrack.participant.sid}`}
          trackRef={screenTrack}
          className="pointer-events-none relative z-0 h-full min-h-[38dvh] w-full flex-1 md:min-h-0 [&_.lk-participant-metadata]:hidden [&_video]:h-full [&_video]:w-full"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between gap-2 bg-gradient-to-b from-black/75 via-black/40 to-transparent p-3">
        <Badge className="gap-1 border-0 bg-emerald-600/90 text-white hover:bg-emerald-600/90">
          <Monitor className="h-3 w-3" />
          Screen share
          {sharerRole && (
            <span className="capitalize opacity-90">· {sharerRole}</span>
          )}
        </Badge>
        {sharerName && (
          <span className="max-w-[40%] truncate rounded-md bg-black/50 px-2 py-1 text-xs text-white sm:max-w-[50%]">
            {sharerName}
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-opacity",
            "opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100",
            screenExpanded && "opacity-100"
          )}
        >
          {screenExpanded ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" />
              Tap to shrink
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" />
              Tap to enlarge
            </>
          )}
        </span>
      </div>
    </div>
  );
}
