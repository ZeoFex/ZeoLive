"use client";

import {
  BookOpen,
  Calendar,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavIconName, NavItemConfig } from "@/lib/navigation";
import { routes } from "@/lib/routes";
import { useUIStore } from "@/store/ui-store";

const navIcons: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  calendar: Calendar,
  users: Users,
  "credit-card": CreditCard,
  "message-square": MessageSquare,
  settings: Settings,
  wallet: CreditCard,
  "file-text": BookOpen,
  shield: BookOpen,
  "bar-chart": BookOpen,
  "clipboard-list": BookOpen,
};

interface StudentSidebarProps {
  items: NavItemConfig[];
}

export function StudentSidebar({ items }: StudentSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <div className="student-shell flex h-14 items-center justify-between px-4 lg:hidden">
        <Link href={routes.student.dashboard} className="flex items-center gap-2">
          <div className="student-logo-badge flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-sm font-bold text-white">Z</span>
          </div>
          <span className="font-bold text-slate-900">ZoeLive</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Open menu">
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
          "student-sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-100 transition-transform lg:static lg:translate-x-0 lg:rounded-3xl lg:border lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 pt-7">
          <Link href={routes.student.dashboard} className="flex items-center gap-2.5">
            <div className="student-logo-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <span className="text-base font-bold text-white">Z</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">ZoeLive</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="px-6 pt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          Student portal
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
                    ? "student-nav-active"
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
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: routes.login })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
            Logout
          </button>
        </nav>

        <div className="student-promo-card mx-4 mb-6 rounded-2xl p-4">
          <p className="text-sm font-semibold text-violet-900">Book your next session</p>
          <p className="mt-1 text-xs text-violet-700/80">
            Browse verified tutors and schedule live classes in minutes.
          </p>
          <Button asChild size="sm" className="student-gradient-btn mt-3 w-full rounded-xl">
            <Link href={routes.student.book} onClick={() => setSidebarOpen(false)}>
              Book now
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
