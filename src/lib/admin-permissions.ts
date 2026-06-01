import type { AdminTier, Role } from "@/generated/prisma";
import { routes } from "@/lib/routes";

/** Admin routes sub-admins may access (tutor review + conversation evidence). */
export const SUBADMIN_ADMIN_PATHS = [
  routes.admin.verification,
  routes.admin.conversations,
] as const;

export function isSubAdminPath(pathname: string) {
  return SUBADMIN_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isSuperAdmin(tier: AdminTier | null | undefined) {
  return tier === "SUPERADMIN";
}

export function canAccessAdminPath(
  pathname: string,
  tier: AdminTier | null | undefined
) {
  if (isSuperAdmin(tier)) return true;
  if (tier === "SUBADMIN") return isSubAdminPath(pathname);
  return false;
}

export function adminDashboardPath(tier: AdminTier | null | undefined) {
  if (tier === "SUBADMIN") return routes.admin.verification;
  return routes.admin.dashboard;
}

export function adminRoleLabel(tier: AdminTier | null | undefined) {
  if (tier === "SUPERADMIN") return "Super Admin";
  if (tier === "SUBADMIN") return "Sub Admin";
  return "Admin";
}

export type AppRole = Role;
