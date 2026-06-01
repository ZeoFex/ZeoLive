"use client";

import { useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useMemo } from "react";
import { ParticipantVideoTile } from "@/components/livekit/ParticipantVideoTile";
import { ScreenShareStage } from "@/components/livekit/ScreenShareStage";
import { useClassroomLayout } from "@/components/livekit/classroom-layout-context";
import { parseParticipantRole } from "@/lib/classroom-participant";
import { cn } from "@/lib/utils";

function sortCameraTracks<T extends { participant: { metadata?: string; sid: string } }>(
  tracks: T[]
): T[] {
  return [...tracks].sort((a, b) => {
    const roleA = parseParticipantRole(a.participant.metadata);
    const roleB = parseParticipantRole(b.participant.metadata);
    if (roleA === "student" && roleB === "tutor") return -1;
    if (roleA === "tutor" && roleB === "student") return 1;
    return a.participant.sid.localeCompare(b.participant.sid);
  });
}

function CameraStrip({
  tracks,
  variant,
  label,
}: {
  tracks: TrackReferenceOrPlaceholder[];
  variant: "filmstrip" | "dock";
  label: string;
}) {
  if (tracks.length === 0) return null;

  return (
    <>
      <p
        className={cn(
          "shrink-0 px-1 font-medium uppercase tracking-wide text-slate-400",
          variant === "dock" ? "text-[9px]" : "mb-2 text-[10px] sm:text-xs"
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          variant === "dock"
            ? "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain"
            : "flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]"
        )}
        role="list"
        aria-label="Participant cameras"
      >
        {tracks.map((trackRef) => (
          <ParticipantVideoTile
            key={`${trackRef.participant.sid}-camera`}
            trackRef={trackRef}
            variant={variant === "dock" ? "dock" : "filmstrip"}
          />
        ))}
      </div>
    </>
  );
}

export function ParticipantGrid({ className }: { className?: string }) {
  const { isScreenSharing, screenExpanded } = useClassroomLayout();

  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  const sortedCameras = useMemo(
    () => sortCameraTracks(cameraTracks),
    [cameraTracks]
  );

  const count = sortedCameras.length;

  if (isScreenSharing) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3 md:p-4",
          screenExpanded ? "flex-row" : "flex-col",
          className
        )}
      >
        <ScreenShareStage
          className={cn(screenExpanded && "min-w-0 flex-1")}
        />

        {sortedCameras.length > 0 && (
          <aside
            className={cn(
              "shrink-0 rounded-xl border border-border/60 bg-slate-900/50 backdrop-blur-sm",
              screenExpanded
                ? "flex w-[5.5rem] min-w-[5.5rem] flex-col p-1.5 sm:w-28 sm:min-w-[7rem] sm:p-2 lg:w-32"
                : "p-2 sm:p-2.5"
            )}
          >
            <CameraStrip
              tracks={sortedCameras}
              variant={screenExpanded ? "dock" : "filmstrip"}
              label="Cameras"
            />
          </aside>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3 md:p-4",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl flex-1 gap-3 overflow-y-auto",
          count <= 1 && "max-w-3xl",
          count === 2 && "grid-cols-1 sm:grid-cols-2",
          count >= 3 && "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {sortedCameras.map((trackRef) => (
          <ParticipantVideoTile
            key={`${trackRef.participant.sid}-camera`}
            trackRef={trackRef}
            variant="grid"
          />
        ))}
      </div>
    </div>
  );
}
