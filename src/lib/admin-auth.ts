import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import type { AdminTier } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/admin-permissions";

export type AdminAuthFailure = { error: NextResponse };
export type AdminAuthSuccess = { session: Session; adminTier: AdminTier | null };

export async function resolveAdminTier(userId: string): Promise<AdminTier | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, adminTier: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  if (user.adminTier) return user.adminTier;

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return adminCount === 1 ? "SUPERADMIN" : "SUBADMIN";
}

export async function requireAdmin(): Promise<AdminAuthFailure | AdminAuthSuccess> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const adminTier =
    session.user.adminTier ?? (await resolveAdminTier(session.user.id));

  return { session, adminTier };
}

export async function requireSuperAdmin(): Promise<
  AdminAuthFailure | AdminAuthSuccess
> {
  const result = await requireAdmin();
  if ("error" in result) return result;

  if (!isSuperAdmin(result.adminTier)) {
    return {
      error: NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/** Superadmin or subadmin — tutor verification review. */
export async function requireTutorReviewAdmin(): Promise<
  AdminAuthFailure | AdminAuthSuccess
> {
  return requireAdmin();
}
