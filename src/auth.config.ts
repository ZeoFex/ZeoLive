import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/auth-env";

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
