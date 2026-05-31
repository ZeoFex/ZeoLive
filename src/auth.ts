import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { requireAuthSecret } from "@/lib/auth-env";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Credentials + JWT: do not use PrismaAdapter (incompatible with credentials flow).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: requireAuthSecret(),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        let adminTier = user.adminTier;
        if (user.role === "ADMIN" && !adminTier) {
          const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
          adminTier = adminCount === 1 ? "SUPERADMIN" : "SUBADMIN";
          await prisma.user.update({
            where: { id: user.id },
            data: { adminTier },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          adminTier,
        };
      },
    }),
  ],
});
