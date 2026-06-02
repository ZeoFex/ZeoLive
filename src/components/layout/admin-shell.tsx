"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import type { NavItemConfig } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Users & Accounts",
  "/admin/verification": "Tutor Verification",
  "/admin/payments": "Payments",
  "/admin/reports": "Analytics & Reports",
  "/admin/cms": "CMS",
  "/admin/settings": "Platform settings",
};

function titleForPath(pathname: string) {
  const match = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Admin";
}

interface AdminShellProps {
  roleLabel: string;
  navItems: NavItemConfig[];
  children: React.ReactNode;
}

export function AdminShell({ roleLabel, navItems, children }: AdminShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pendingCount, setPendingCount] = useState(0);
  const isSuperAdmin = session?.user?.adminTier === "SUPERADMIN";

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((data) => {
          const pending = (data.pendingTutors ?? 0) + (data.awaitingFinal ?? 0);
          setPendingCount(pending);
        })
        .catch(() => {});
      return;
    }

    fetch("/api/admin/verification?status=pending")
      .then((r) => r.json())
      .then((data) => setPendingCount(data.items?.length ?? 0))
      .catch(() => {});
  }, [pathname, isSuperAdmin]);

  return (
    <div className="admin-shell min-h-screen p-0 lg:p-4">
      <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-2rem)] lg:flex-row lg:gap-4">
        <AdminSidebar
          items={navItems}
          roleLabel={roleLabel}
          pendingCount={pendingCount}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-3xl lg:border lg:border-slate-100 lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]">
          <AdminTopbar title={titleForPath(pathname)} />
          <div className="admin-page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
