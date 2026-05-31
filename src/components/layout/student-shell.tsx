"use client";

import { usePathname } from "next/navigation";
import { StudentMobileNav } from "@/components/layout/student-mobile-nav";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentTopbar } from "@/components/layout/student-topbar";
import { studentNav } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/student/dashboard": "Dashboard",
  "/student/classes": "My Classes",
  "/student/book": "Book Session",
  "/student/tutors": "Tutors",
  "/student/payments": "Payments",
  "/student/messages": "Messages",
  "/student/settings": "Settings",
};

function titleForPath(pathname: string) {
  const match = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Student";
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="student-shell min-h-dvh p-0 lg:min-h-screen lg:p-4">
      <div className="flex min-h-dvh flex-col lg:min-h-[calc(100vh-2rem)] lg:flex-row lg:gap-4">
        <StudentSidebar items={studentNav} />

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-3xl lg:border lg:border-slate-100 lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]">
          <StudentTopbar title={titleForPath(pathname)} />
          <div className="student-page-content">{children}</div>
          <StudentMobileNav />
        </main>
      </div>
    </div>
  );
}
