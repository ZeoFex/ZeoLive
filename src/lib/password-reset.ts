import { createHash, randomBytes } from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000;

export function createPasswordResetToken() {
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashPasswordResetToken(rawToken);
  const expires = new Date(Date.now() + RESET_TTL_MS);
  return { rawToken, hashedToken, expires };
}

export function hashPasswordResetToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}
