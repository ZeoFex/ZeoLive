"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";

/**
 * Sign out without Auth.js redirecting to AUTH_URL (e.g. localhost baked into env).
 * Always returns to a path on the current origin (production or local dev).
 */
export async function signOutToAppPath(path: string) {
  await nextAuthSignOut({ redirect: false });
  if (typeof window !== "undefined") {
    window.location.assign(path);
  }
}
