"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import {
  adminRoleLabel,
  canAccessAdminPath,
} from "@/lib/admin-permissions";
import { navForAdminTier } from "@/lib/navigation";
import { routes } from "@/lib/routes";
import "./admin-theme.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isPublicAdmin =
    pathname.startsWith("/admin/setup") || pathname.startsWith("/admin/login");

  const adminTier = session?.user?.adminTier ?? null;

  useEffect(() => {
    if (status === "loading") return;

    const hardGo = (path: string) => {
      if (window.location.pathname === path) return;
      window.location.replace(path);
    };

    if (isPublicAdmin) {
      if (status === "authenticated" && session?.user?.role === "ADMIN") {
        hardGo(
          adminTier === "SUBADMIN"
            ? routes.admin.verification
            : routes.admin.dashboard
        );
      }
      return;
    }

    if (status === "unauthenticated") {
      hardGo(
        `${routes.adminLogin}?callbackUrl=${encodeURIComponent(pathname)}`
      );
      return;
    }

    if (session?.user?.role !== "ADMIN") {
      hardGo(routes.login);
      return;
    }

    if (!canAccessAdminPath(pathname, adminTier)) {
      hardGo(routes.admin.verification);
    }
  }, [adminTier, isPublicAdmin, pathname, session, status]);

  if (isPublicAdmin) {
    return <>{children}</>;
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading admin…
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-sm text-slate-500">
        Redirecting…
      </div>
    );
  }

  return (
    <AdminShell
      roleLabel={adminRoleLabel(adminTier)}
      navItems={navForAdminTier(adminTier)}
    >
      {children}
    </AdminShell>
  );
}
