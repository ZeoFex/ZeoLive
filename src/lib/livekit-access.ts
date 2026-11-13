import { markSessionActive } from "@/lib/classroom-access";
import { resolveClassroomActor } from "@/lib/classroom-connection";
import { createLiveKitToken, getLiveKitServerUrl, isLiveKitConfigured } from "@/lib/livekit";
import { meetingIsFull, returningAttendanceKey } from "@/lib/participant-limit";
import { linkedAccountUserId, recordSessionAttendance } from "@/lib/record-attendance";
import { notifyBookedStudentsSessionStarted } from "@/lib/session-started";

export async function issueClassroomToken(
  request: Request,
  room: string,
  requestedRole?: "student" | "tutor"
) {
  if (!isLiveKitConfigured()) {
    return { error: "LiveKit is not configured on the server", status: 503 as const };
  }

  const resolved = await resolveClassroomActor(room, request);
  if ("error" in resolved) {
    return { error: resolved.error, status: resolved.status };
  }

  const role = requestedRole ?? resolved.actor.role;
  if (resolved.actor.role !== role) {
    return { error: "Role does not match your session assignment", status: 403 as const };
  }

  if (role !== "tutor" && resolved.actor.session.shareable) {
    const linkedUserId = await linkedAccountUserId(resolved.actor);
    const full = await meetingIsFull({
      sessionId: resolved.actor.session.id,
      tutorId: resolved.actor.session.tutorId,
      seatLimit: resolved.actor.session.seatLimit,
      returningKey: returningAttendanceKey(linkedUserId ?? resolved.actor.identity, linkedUserId ? false : resolved.actor.guest),
      returningUserId: linkedUserId,
    });
    if (full) {
      return { error: "This meeting is full", status: 403 as const };
    }
  }

  const token = await createLiveKitToken(room, resolved.actor.identity, resolved.actor.name, role);

  const linkedUserId = await linkedAccountUserId(resolved.actor);
  await recordSessionAttendance({
    tutoringSessionId: resolved.actor.session.id,
    identity: linkedUserId ?? resolved.actor.identity,
    guest: linkedUserId ? false : resolved.actor.guest,
    displayName: resolved.actor.name,
    role,
  });

  if (role === "tutor") {
    const started = await markSessionActive(room);
    if (started) {
      await notifyBookedStudentsSessionStarted(room).catch((error) => {
        console.error("Session start notification failed:", error);
      });
    }
  }

  return { token, serverUrl: getLiveKitServerUrl() };
}
