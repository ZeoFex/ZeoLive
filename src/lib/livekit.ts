import { AccessToken } from "livekit-server-sdk";
import type { AccessTokenOptions, VideoGrant } from "livekit-server-sdk";

export type ClassroomRole = "student" | "tutor";

/** WebSocket URL for clients (wss://…). Accepts either env name LiveKit docs use. */
export function getLiveKitServerUrl() {
  return (
    process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim() ||
    process.env.LIVEKIT_URL?.trim() ||
    ""
  );
}

export function isLiveKitConfigured() {
  return Boolean(
    process.env.LIVEKIT_API_KEY?.trim() &&
      process.env.LIVEKIT_API_SECRET?.trim() &&
      getLiveKitServerUrl()
  );
}

export async function createLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName: string,
  role: ClassroomRole
): Promise<string> {
  if (!isLiveKitConfigured()) {
    throw new Error(
      "LiveKit is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL (or NEXT_PUBLIC_LIVEKIT_URL)."
    );
  }

  const tokenOptions: AccessTokenOptions = {
    identity: participantIdentity,
    name: participantName,
    metadata: JSON.stringify({ role }),
  };

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    tokenOptions
  );

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
  };

  if (role === "tutor") {
    grant.roomAdmin = true;
    grant.canPublish = true;
  } else {
    grant.canPublish = true;
  }

  at.addGrant(grant);
  return at.toJwt();
}
