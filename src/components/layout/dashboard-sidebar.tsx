"use client";

import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutToAppPath } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavIconName, NavItemConfig } from "@/lib/navigation";
import { useUIStore } from "@/store/ui-store";

const navIcons: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  calendar: Calendar,
  users: Users,
  "credit-card": CreditCard,
  "message-square": MessageSquare,
  settings: Settings,
  wallet: Wallet,
  "file-text": FileText,
  shield: Shield,
  "bar-chart": BarChart3,
  "clipboard-list": ClipboardList,
};

interface DashboardSidebarProps {
  items: NavItemConfig[];
  title: string;
  roleLabel: string;
}

export function DashboardSidebar({
  items,
  title,
  roleLabel,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <span className="font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              Z
            </div>
            <div>
              <span className="font-bold">{title}</span>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
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

        <nav className="flex-1 space-y-1 p-4">
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => void signOutToAppPath("/login")}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
