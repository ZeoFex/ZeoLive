import type { NextAuthConfig } from "next-auth";
import {
  getAppBaseUrl,
  inferDeploymentBaseUrl,
  isLocalhostAppUrl,
  syncAuthUrlForDeployment,
} from "@/lib/app-url";
import { getAuthSecret } from "@/lib/auth-env";

syncAuthUrlForDeployment();

type AppRole = "STUDENT" | "TUTOR" | "ADMIN";
type AppAdminTier = "SUPERADMIN" | "SUBADMIN";

/**
 * Shared Auth.js config (edge-safe — no Prisma imports).
 */
export const authConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      let safeBase = baseUrl;
      if (isLocalhostAppUrl(baseUrl)) {
        safeBase =
          getAppBaseUrl() !== "http://localhost:3000"
            ? getAppBaseUrl()
            : (inferDeploymentBaseUrl() ?? baseUrl);
      }

      if (url.startsWith("/")) {
        return `${safeBase}${url}`;
      }

      try {
        const target = new URL(url);
        const base = new URL(safeBase);
        if (target.origin === base.origin) return url;
        if (
          isLocalhostAppUrl(target.origin) &&
          !isLocalhostAppUrl(base.origin)
        ) {
          return `${safeBase}${target.pathname}${target.search}`;
        }
      } catch {
        /* ignore malformed url */
      }

      return safeBase;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        const next = session as {
          name?: string | null;
          email?: string | null;
          image?: string | null;
        };
        if (typeof next.name === "string") token.name = next.name;
        if (typeof next.email === "string") token.email = next.email;
        if (typeof next.image === "string") {
          token.picture = next.image || undefined;
        }
      }

      if (user?.id) {
        token.id = user.id;
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
        if (user.image) token.picture = user.image;
        const role = (user as { role?: AppRole }).role;
        if (role) token.role = role;
        const adminTier = (user as { adminTier?: AppAdminTier | null }).adminTier;
        if (adminTier) token.adminTier = adminTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.adminTier = token.adminTier as AppAdminTier | undefined;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
        session.user.image =
          typeof token.picture === "string" ? token.picture : null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
