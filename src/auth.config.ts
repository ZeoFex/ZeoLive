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
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
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
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
