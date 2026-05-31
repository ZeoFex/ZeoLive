import type { DefaultSession } from "next-auth";
import type { AdminTier, Role } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      adminTier?: AdminTier;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    adminTier?: AdminTier | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    adminTier?: AdminTier;
  }
}
