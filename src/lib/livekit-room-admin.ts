import { RoomServiceClient, TrackSource, type ParticipantInfo } from "livekit-server-sdk";
import { getLiveKitServerUrl, isLiveKitConfigured } from "@/lib/livekit";

function liveKitHttpUrl() {
  const url = getLiveKitServerUrl();
  if (url.startsWith("wss://")) return `https://${url.slice("wss://".length)}`;
  if (url.startsWith("ws://")) return `http://${url.slice("ws://".length)}`;
  return url;
}

export function getRoomService() {
  if (!isLiveKitConfigured()) {
    throw new Error("LiveKit is not configured on the server");
  }
  return new RoomServiceClient(
    liveKitHttpUrl(),
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

function participantRole(info: ParticipantInfo) {
  try {
    const data = JSON.parse(info.metadata) as { role?: string };
    return data.role ?? null;
  } catch {
    return null;
  }
}

const audienceSources = [
  TrackSource.CAMERA,
  TrackSource.SCREEN_SHARE,
  TrackSource.SCREEN_SHARE_AUDIO,
];

const openSources = [TrackSource.MICROPHONE, ...audienceSources];

export async function moderateParticipant(
  room: string,
  identity: string,
  action: "mute" | "unmute" | "remove"
) {
  const client = getRoomService();
  const people = await client.listParticipants(room);
  const person = people.find((item) => item.identity === identity);
  if (!person) {
    throw new Error("That person is no longer in the meeting");
  }
  if (participantRole(person) === "tutor") {
    throw new Error("The host cannot be changed from this action");
  }

  if (action === "remove") {
    await client.removeParticipant(room, identity);
    return;
  }

  const allowMic = action === "unmute";
  let metadata = person.metadata;
  try {
    const current = JSON.parse(person.metadata || "{}") as { role?: string };
    metadata = JSON.stringify({
      ...current,
      role: current.role ?? "student",
      micLocked: !allowMic,
    });
  } catch {
    metadata = JSON.stringify({ role: "student", micLocked: !allowMic });
  }
  await client.updateParticipant(room, identity, {
    metadata,
    permission: {
      canSubscribe: true,
      canPublish: true,
      canPublishData: true,
      canPublishSources: allowMic ? openSources : audienceSources,
      hidden: false,
      recorder: false,
    },
  });

  for (const track of person.tracks) {
    if (track.source === TrackSource.MICROPHONE) {
      await client.mutePublishedTrack(room, identity, track.sid, !allowMic);
    }
  }
}
