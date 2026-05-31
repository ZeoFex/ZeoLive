"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const { data: session, status } = useSession();

  const isPublicAdmin =
    pathname.startsWith("/admin/setup") || pathname.startsWith("/admin/login");

  const adminTier = session?.user?.adminTier ?? "SUBADMIN";

  useEffect(() => {
    if (isPublicAdmin || status !== "authenticated") return;
    if (session?.user?.role !== "ADMIN") return;

    if (!canAccessAdminPath(pathname, adminTier)) {
      router.replace(routes.admin.verification);
    }
  }, [adminTier, isPublicAdmin, pathname, router, session, status]);

  if (isPublicAdmin) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading admin…
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
