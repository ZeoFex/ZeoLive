const PLACEHOLDER_SECRETS = new Set([
  "",
  "your-long-random-secret",
  "changeme",
  "replace-me",
]);

/**
 * Auth.js reads AUTH_SECRET (v5) or legacy NEXTAUTH_SECRET.
 */
export function getAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || PLACEHOLDER_SECRETS.has(secret.trim())) {
    return undefined;
  }
  return secret;
}

export function requireAuthSecret(): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is missing or still a placeholder. Add a real value to .env.local (run: openssl rand -base64 32)"
    );
  }
  return secret;
}
