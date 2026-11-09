"use client";

import {
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  Video,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutToAppPath } from "@/lib/auth-client";
import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
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
  "message-square": MessageSquare,
  settings: Settings,
  video: Video,
  "help-circle": HelpCircle,
};

interface TutorSidebarProps {
  items: NavItemConfig[];
  roleLabel: string;
}

export function TutorSidebar({
  items,
  roleLabel,
}: TutorSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <>
      <div className="tutor-shell flex h-14 shrink-0 items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] lg:hidden">
        <Logo href={routes.tutor.dashboard} size="sm" />
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "tutor-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,280px)] flex-col overflow-hidden border-r border-slate-100 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-full lg:w-[260px] lg:shrink-0 lg:translate-x-0 lg:rounded-3xl lg:border lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 pt-7">
          <Logo href={routes.tutor.dashboard} size="md" />
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
          {roleLabel}
        </p>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-6 pt-6">
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
      </aside>
    </>
  );
}
