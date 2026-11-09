"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";

/**
 * Sign out without Auth.js redirecting to AUTH_URL (e.g. localhost baked into env).
 * Always returns to a path on the current origin (production or local dev).
 */
export async function signOutToAppPath(path: string) {
  const nextPath = path.startsWith("/") ? path : `/${path}`;
  try {
    await nextAuthSignOut({ redirect: false });
  } catch {
    // Still leave the app even if the session revoke call fails.
  }
  if (typeof window !== "undefined") {
    window.location.assign(`${window.location.origin}${nextPath}`);
  }
}
