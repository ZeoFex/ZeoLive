import type { Role, AdminTier } from "@/generated/prisma";
import { adminDashboardPath } from "@/lib/admin-permissions";
import { dashboardForRole, routes, safeCallbackForRole } from "@/lib/routes";

export { dashboardForRole, safeCallbackForRole };

export function roleDashboardPath(role: Role) {
  return dashboardForRole(role);
}

/** Where to send the user immediately after a successful sign-in. */
export async function resolvePostLoginPath(
  role: Role,
  adminTier?: AdminTier | null
): Promise<string> {
  switch (role) {
    case "ADMIN":
      return adminDashboardPath(adminTier);
    case "STUDENT":
      return routes.student.dashboard;
    case "TUTOR":
    default: {
      if (role !== "TUTOR") {
        return routes.student.dashboard;
      }
      try {
        const res = await fetch("/api/tutor/onboarding/status");
        if (!res.ok) return routes.tutor.dashboard;
        const data = await res.json();
        if (!data.onboardingComplete) {
          return routes.tutor.onboarding;
        }
        return routes.tutor.dashboard;
      } catch {
        return routes.tutor.dashboard;
      }
    }
  }
}

/** Resolve destination: explicit callback wins if valid for role, else role default. */
export async function resolveAuthRedirect(
  role: Role,
  callbackUrl?: string | null,
  adminTier?: AdminTier | null
): Promise<string> {
  const safe = safeCallbackForRole(callbackUrl, role);
  if (safe) return safe;
  return resolvePostLoginPath(role, adminTier);
}
