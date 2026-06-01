import type {
  ScreenShareCaptureOptions,
  TrackPublishOptions,
} from "livekit-client";
import { ScreenSharePresets } from "livekit-client";

/** 1080p30 capture — sharp slides and text (LiveKit default for non-Safari). */
export const SCREEN_SHARE_CAPTURE: ScreenShareCaptureOptions = {
  audio: true,
  selfBrowserSurface: "exclude",
  surfaceSwitching: "include",
  systemAudio: "include",
  resolution: ScreenSharePresets.h1080fps30.resolution,
  contentHint: "detail",
};

/** High bitrate + maintain resolution so shared content stays readable. */
export const SCREEN_SHARE_PUBLISH: TrackPublishOptions = {
  screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
  videoEncoding: ScreenSharePresets.h1080fps30.encoding,
  degradationPreference: "maintain-resolution",
  simulcast: true,
  screenShareSimulcastLayers: [
    ScreenSharePresets.h720fps15,
    ScreenSharePresets.h1080fps30,
  ],
};
