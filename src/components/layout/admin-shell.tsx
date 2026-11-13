"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import type { NavItemConfig } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Users & Accounts",
  "/admin/verification": "Tutor Verification",
  "/admin/programmes": "Programmes & Subjects",
  "/admin/payments": "Payments",
  "/admin/class-size": "Class size",
  "/admin/class-reports": "Class reports",
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

  return (
    <div className="admin-shell h-dvh overflow-hidden p-0 lg:h-screen lg:p-4">
      <div className="flex h-full flex-col lg:flex-row lg:gap-4">
        <AdminSidebar items={navItems} roleLabel={roleLabel} />

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-3xl lg:border lg:border-slate-100 lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]">
          <AdminTopbar title={titleForPath(pathname)} />
          <div className="admin-page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
