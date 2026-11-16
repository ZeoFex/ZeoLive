import { TrackSource } from "livekit-server-sdk";

export function studentPublishSources(allowMic: boolean, allowScreen: boolean) {
  const sources = [TrackSource.CAMERA];
  if (allowMic) sources.push(TrackSource.MICROPHONE);
  if (allowScreen) {
    sources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);
  }
  return sources;
}
