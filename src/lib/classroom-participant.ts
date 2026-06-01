import type { ClassroomRole } from "@/lib/livekit";

export function parseParticipantRole(metadata?: string): ClassroomRole | null {
  if (!metadata) return null;
  try {
    const data = JSON.parse(metadata) as { role?: string };
    if (data.role === "tutor" || data.role === "student") return data.role;
  } catch {
    return null;
  }
  return null;
}

export function participantLabel(participant: {
  name?: string;
  identity: string;
}) {
  return participant.name?.trim() || participant.identity;
}
