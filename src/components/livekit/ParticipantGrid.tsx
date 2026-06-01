"use client";

import {
  ParticipantTile,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function parseRole(metadata?: string): "tutor" | "student" | null {
  if (!metadata) return null;
  try {
    const data = JSON.parse(metadata) as { role?: string };
    if (data.role === "tutor" || data.role === "student") return data.role;
  } catch {
    return null;
  }
  return null;
}

export function ParticipantGrid({ className }: { className?: string }) {
  const participants = useParticipants();
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  const hasScreenShare = screenTracks.some((t) => t.publication?.track);

  return (
    <div className={cn("flex flex-1 flex-col gap-3 p-3 md:p-4", className)}>
      {hasScreenShare && (
        <div className="relative aspect-video max-h-[45vh] overflow-hidden rounded-2xl border border-border bg-muted">
          {screenTracks.map((trackRef) =>
            trackRef.publication ? (
              <ParticipantTile
                key={trackRef.participant.sid + "-screen"}
                trackRef={trackRef}
                className="h-full w-full [&_video]:object-contain"
              />
            ) : null
          )}
          <Badge className="absolute left-3 top-3 bg-black/60 text-white">
            Screen share
          </Badge>
        </div>
      )}

      <div
        className={cn(
          "grid flex-1 gap-3",
          participants.length <= 1
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2"
        )}
      >
        {cameraTracks.map((trackRef) => {
          const role = parseRole(trackRef.participant.metadata);
          return (
            <div
              key={trackRef.participant.sid}
              className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted shadow-sm"
            >
              <ParticipantTile
                trackRef={trackRef}
                className="h-full w-full [&_video]:object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/55 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                <span className="font-medium">
                  {trackRef.participant.name || trackRef.participant.identity}
                </span>
                {role && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] capitalize text-white/90"
                  >
                    {role}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
