"use client";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import {
  adminNav,
  studentNav,
  tutorNav,
  type NavItemConfig,
} from "@/lib/navigation";

type DashboardRole = "student" | "tutor" | "admin";

const navByRole: Record<DashboardRole, NavItemConfig[]> = {
  student: studentNav,
  tutor: tutorNav,
  admin: adminNav,
};

interface DashboardShellProps {
  role: DashboardRole;
  title?: string;
  roleLabel: string;
  navItems?: NavItemConfig[];
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  title = "Zeolive",
  roleLabel,
  navItems,
  children,
}: DashboardShellProps) {
  const items = navItems ?? navByRole[role];

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={items} title={title} roleLabel={roleLabel} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
