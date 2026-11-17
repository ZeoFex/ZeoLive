import { DataPacket_Kind, RoomServiceClient, TrackSource, type ParticipantInfo } from "livekit-server-sdk";
import { FLOOR_TOPIC } from "@/lib/classroom-floor";
import { getLiveKitServerUrl, isLiveKitConfigured } from "@/lib/livekit";
import { studentPublishSources } from "@/lib/livekit-publish";

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

type ParticipantMeta = {
  role?: string;
  micLocked?: boolean;
  micSeq?: number;
  screenShare?: boolean;
};

function readMeta(metadata: string): ParticipantMeta {
  try {
    const data = JSON.parse(metadata || "{}") as ParticipantMeta;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function participantRole(info: ParticipantInfo) {
  return readMeta(info.metadata).role ?? null;
}

function permissionFor(allowMic: boolean, allowScreen: boolean) {
  return {
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    canPublishSources: studentPublishSources(allowMic, allowScreen),
    hidden: false,
    recorder: false,
  };
}

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
  const current = readMeta(person.metadata);
  const allowScreen = current.screenShare === true;
  const metadata = JSON.stringify({
    ...current,
    role: current.role ?? "student",
    micLocked: !allowMic,
    micSeq: (typeof current.micSeq === "number" ? current.micSeq : 0) + 1,
    screenShare: allowScreen,
  });
  await client.updateParticipant(room, identity, {
    metadata,
    permission: permissionFor(allowMic, allowScreen),
  });

  for (const track of person.tracks) {
    if (track.source === TrackSource.MICROPHONE) {
      await client.mutePublishedTrack(room, identity, track.sid, !allowMic);
    }
  }
}

export async function findRoomParticipant(room: string, identity: string) {
  const client = getRoomService();
  const people = await client.listParticipants(room);
  return people.find((item) => item.identity === identity) ?? null;
}

export async function setScreenShareAllowed(room: string, identity: string, allowed: boolean) {
  const client = getRoomService();
  const person = await findRoomParticipant(room, identity);
  if (!person) {
    if (!allowed) return;
    throw new Error("That person is no longer in the meeting");
  }
  if (participantRole(person) === "tutor") {
    throw new Error("The host can already share a screen");
  }

  const current = readMeta(person.metadata);
  await client.updateParticipant(room, identity, {
    metadata: JSON.stringify({
      ...current,
      role: current.role ?? "student",
      micLocked: current.micLocked === true,
      screenShare: allowed,
    }),
    permission: permissionFor(current.micLocked !== true, allowed),
  });

  if (!allowed) {
    for (const track of person.tracks) {
      if (
        track.source === TrackSource.SCREEN_SHARE ||
        track.source === TrackSource.SCREEN_SHARE_AUDIO
      ) {
        await client.mutePublishedTrack(room, identity, track.sid, true);
      }
    }
  }
}

export async function closeLiveKitRoom(room: string) {
  if (!isLiveKitConfigured()) return;
  try {
    await getRoomService().deleteRoom(room);
  } catch {
    /* The room is already closed. */
  }
}

export async function publishFloorRefresh(room: string) {
  if (!isLiveKitConfigured()) return;
  try {
    const client = getRoomService();
    await client.sendData(
      room,
      new TextEncoder().encode(JSON.stringify({ type: "refresh" })),
      DataPacket_Kind.RELIABLE,
      { topic: FLOOR_TOPIC }
    );
  } catch {
    /* The room may not be open yet. Clients also refresh on a timer. */
  }
}
