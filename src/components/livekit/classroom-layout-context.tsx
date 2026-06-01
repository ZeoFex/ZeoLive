"use client";

import { useTracks, type TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track, VideoQuality, type RemoteTrackPublication } from "livekit-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  parseParticipantRole,
  participantLabel,
} from "@/lib/classroom-participant";

type ClassroomLayoutContextValue = {
  isScreenSharing: boolean;
  screenTrack: TrackReferenceOrPlaceholder | undefined;
  sharerName: string | null;
  sharerRole: ReturnType<typeof parseParticipantRole>;
  screenExpanded: boolean;
  toggleScreenExpanded: () => void;
  setScreenExpanded: (expanded: boolean) => void;
};

const ClassroomLayoutContext = createContext<ClassroomLayoutContextValue>({
  isScreenSharing: false,
  screenTrack: undefined,
  sharerName: null,
  sharerRole: null,
  screenExpanded: false,
  toggleScreenExpanded: () => {},
  setScreenExpanded: () => {},
});

function boostScreenShareQuality(
  screenTrack: TrackReferenceOrPlaceholder | undefined,
  expanded: boolean
) {
  const publication = screenTrack?.publication;
  if (!publication || publication.kind !== Track.Kind.Video) return;

  if (!("setVideoQuality" in publication)) return;

  const remote = publication as RemoteTrackPublication;
  remote.setVideoQuality(VideoQuality.HIGH);
  remote.setVideoFPS(30);

  if (expanded) {
    remote.setVideoDimensions({ width: 1920, height: 1080 });
  }
}

/** Single subscription for screen-share state — avoids duplicate hooks and layout thrashing. */
export function ClassroomLayoutProvider({ children }: { children: ReactNode }) {
  const [screenExpanded, setScreenExpanded] = useState(false);

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  const screenTrack = useMemo(
    () =>
      screenTracks.find(
        (t) =>
          t.source === Track.Source.ScreenShare &&
          t.publication !== undefined &&
          t.publication.track !== undefined
      ),
    [screenTracks]
  );

  const isScreenSharing = Boolean(screenTrack);

  useEffect(() => {
    if (!isScreenSharing) {
      setScreenExpanded(false);
    }
  }, [isScreenSharing]);

  useEffect(() => {
    boostScreenShareQuality(screenTrack, screenExpanded);
  }, [screenTrack, screenExpanded]);

  const toggleScreenExpanded = useCallback(() => {
    setScreenExpanded((v) => !v);
  }, []);

  const value = useMemo<ClassroomLayoutContextValue>(
    () => ({
      isScreenSharing,
      screenTrack,
      sharerName: screenTrack ? participantLabel(screenTrack.participant) : null,
      sharerRole: screenTrack
        ? parseParticipantRole(screenTrack.participant.metadata)
        : null,
      screenExpanded,
      toggleScreenExpanded,
      setScreenExpanded,
    }),
    [
      isScreenSharing,
      screenTrack,
      screenExpanded,
      toggleScreenExpanded,
    ]
  );

  return (
    <ClassroomLayoutContext.Provider value={value}>
      {children}
    </ClassroomLayoutContext.Provider>
  );
}

export function useClassroomLayout() {
  return useContext(ClassroomLayoutContext);
}
