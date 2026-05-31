import { AccessToken } from "livekit-server-sdk";
import type { AccessTokenOptions, VideoGrant } from "livekit-server-sdk";

export function isLiveKitConfigured() {
  return Boolean(
    process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET &&
      process.env.NEXT_PUBLIC_LIVEKIT_URL
  );
}

export function createLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  options?: { canPublish?: boolean; canSubscribe?: boolean }
) {
  if (!isLiveKitConfigured()) {
    throw new Error(
      "LiveKit is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL."
    );
  }

  const tokenOptions: AccessTokenOptions = {
    identity: participantIdentity,
    name: participantName,
  };

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    tokenOptions
  );

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: options?.canPublish ?? true,
    canSubscribe: options?.canSubscribe ?? true,
  };

  at.addGrant(grant);

  return at.toJwt();
}
