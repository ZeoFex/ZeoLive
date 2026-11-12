import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { requireAuthSecret } from "@/lib/auth-env";

export const MEETING_GUEST_COOKIE = "ztl_meeting_guest";
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export interface MeetingGuest {
  roomId: string;
  guestId: string;
  name: string;
  exp: number;
}

export function cleanDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) return null;
  return name;
}

export function createMeetingGuest(roomId: string, name: string): MeetingGuest {
  return {
    roomId,
    guestId: randomBytes(9).toString("hex"),
    name,
    exp: Date.now() + EIGHT_HOURS_MS,
  };
}

function sign(payload: string) {
  return createHmac("sha256", requireAuthSecret()).update(payload).digest("base64url");
}

export function sealMeetingGuest(guest: MeetingGuest) {
  const payload = Buffer.from(JSON.stringify(guest)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function openMeetingGuest(token: string | undefined | null): MeetingGuest | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let expected = "";
  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as MeetingGuest;
    if (!data.roomId || !data.guestId || !data.name || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    const name = cleanDisplayName(data.name);
    if (!name) return null;
    return { ...data, name };
  } catch {
    return null;
  }
}

export function readMeetingGuest(request: Request): MeetingGuest | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) !== MEETING_GUEST_COOKIE) continue;
    return openMeetingGuest(decodeURIComponent(trimmed.slice(eq + 1)));
  }
  return null;
}

export const meetingGuestCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: EIGHT_HOURS_MS / 1000,
};
