"use client";

import {
  BarChart3,
  ClipboardList,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Shield,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutToAppPath } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavIconName, NavItemConfig } from "@/lib/navigation";
import { routes } from "@/lib/routes";
import { useUIStore } from "@/store/ui-store";

const navIcons: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "book-open": LayoutDashboard,
  calendar: LayoutDashboard,
  users: Users,
  "credit-card": CreditCard,
  "message-square": HelpCircle,
  settings: Settings2,
  wallet: CreditCard,
  "file-text": ClipboardList,
  shield: Shield,
  "bar-chart": BarChart3,
  "clipboard-list": ClipboardList,
};

interface AdminSidebarProps {
  items: NavItemConfig[];
  roleLabel: string;
  pendingCount?: number;
}

export function AdminSidebar({ items, roleLabel, pendingCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <div className="admin-shell flex h-14 items-center justify-between px-4 lg:hidden">
        <Image
          src="/images/zoelive-logo.png"
          alt="Zeolive"
          width={120}
          height={40}
          className="h-8 w-auto object-contain"
        />
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col rounded-none border-r border-slate-100 transition-transform lg:static lg:translate-x-0 lg:rounded-3xl lg:border lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 pt-7">
          <Link href={routes.admin.dashboard} className="flex items-center gap-2.5">
            <div className="admin-logo-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <span className="text-base font-bold text-white">Z</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Zeolive</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="px-6 pt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          {roleLabel}
        </p>

        <nav className="flex-1 space-y-1 px-4 pt-6">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main
          </p>
          {items.map((item) => {
            const Icon = navIcons[item.icon];
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "admin-nav-active"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}

          <p className="px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Other
          </p>
          <Link
            href={routes.home}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={2} />
            Help / Support
          </Link>
          <button
            type="button"
            onClick={() => void signOutToAppPath(routes.adminLogin)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
            Logout
          </button>
        </nav>

        {pendingCount > 0 ? (
          <div className="mx-4 mb-6 rounded-2xl p-4 admin-promo-card">
            <p className="text-sm font-semibold text-blue-900">Verification queue</p>
            <p className="mt-1 text-xs text-blue-700/80">
              {pendingCount} tutor application{pendingCount === 1 ? "" : "s"} need attention.
            </p>
            <Button
              asChild
              size="sm"
              className="admin-gradient-btn mt-3 w-full rounded-xl"
            >
              <Link href={`${routes.admin.verification}?status=pending`}>Review now</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-4 mb-6 rounded-2xl p-4 admin-promo-card">
            <p className="text-sm font-semibold text-blue-900">Platform admin</p>
            <p className="mt-1 text-xs text-blue-700/80">
              Manage users, verify tutors, and monitor platform activity from one place.
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="admin-outline-btn mt-3 w-full rounded-xl"
            >
              <Link href={routes.admin.dashboard}>View overview</Link>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
