"use client";

import { BookOpen, Calendar, LayoutDashboard, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const MOBILE_NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  accent?: boolean;
}[] = [
  { href: routes.student.dashboard, label: "Home", icon: LayoutDashboard },
  { href: routes.student.classes, label: "Classes", icon: BookOpen },
  { href: routes.student.book, label: "Book", icon: Calendar, accent: true },
  { href: routes.student.messages, label: "Messages", icon: MessageSquare },
];

export function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="student-mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 lg:hidden"
      aria-label="Student portal navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-2">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== routes.student.dashboard && pathname.startsWith(item.href));

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="student-mobile-nav-accent -mt-3 flex flex-col items-center justify-center"
                aria-current={active ? "page" : undefined}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <span className="mt-1 text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "student-mobile-nav-item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors",
                active && "student-mobile-nav-item-active"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="truncate text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
