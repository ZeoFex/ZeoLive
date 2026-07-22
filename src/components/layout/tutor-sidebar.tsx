"use client";

import {
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutToAppPath } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/lib/navigation";
import { routes } from "@/lib/routes";
import { useUIStore } from "@/store/ui-store";

const navIcons: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "book-open": BookOpen,
  wallet: Wallet,
  calendar: Calendar,
  "file-text": FileText,
  settings: Settings,
};

interface TutorSidebarProps {
  items: NavItemConfig[];
  roleLabel: string;
  upcomingCount?: number;
}

export function TutorSidebar({
  items,
  roleLabel,
  upcomingCount = 0,
}: TutorSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <div className="tutor-shell flex h-14 items-center justify-between px-4 lg:hidden">
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
          "tutor-sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col rounded-none border-r border-slate-100 transition-transform lg:static lg:translate-x-0 lg:rounded-3xl lg:border lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 pt-7">
          <Link href={routes.tutor.dashboard} className="flex items-center gap-2.5">
            <div className="tutor-logo-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
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
            const Icon = navIcons[item.icon] ?? LayoutDashboard;
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
                    ? "tutor-nav-active"
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
            onClick={() => void signOutToAppPath(routes.login)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
            Logout
          </button>
        </nav>

        {upcomingCount > 0 ? (
          <div className="mx-4 mb-6 rounded-2xl p-4 tutor-promo-card">
            <p className="text-sm font-semibold text-blue-900">Upcoming sessions</p>
            <p className="mt-1 text-xs text-blue-700/80">
              You have {upcomingCount} session{upcomingCount === 1 ? "" : "s"} scheduled soon.
            </p>
            <Button
              asChild
              size="sm"
              className="tutor-gradient-btn mt-3 w-full rounded-xl"
            >
              <Link href={routes.tutor.sessions}>View schedule</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-4 mb-6 rounded-2xl p-4 tutor-promo-card">
            <p className="text-sm font-semibold text-blue-900">Grow your reach</p>
            <p className="mt-1 text-xs text-blue-700/80">
              Keep your availability updated so students can book more sessions with you.
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="tutor-outline-btn mt-3 w-full rounded-xl"
            >
              <Link href={routes.tutor.availability}>Set availability</Link>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
