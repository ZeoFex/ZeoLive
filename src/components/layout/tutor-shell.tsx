"use client";

import { usePathname } from "next/navigation";
import { TutorSidebar } from "@/components/layout/tutor-sidebar";
import { TutorTopbar } from "@/components/layout/tutor-topbar";
import { tutorNav } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/tutor/dashboard": "Dashboard",
  "/tutor/students": "Students",
  "/tutor/scheduling": "Scheduling sessions",
  "/tutor/sessions": "Booking sessions",
  "/tutor/earnings": "Earnings",
  "/tutor/availability": "Availability",
  "/tutor/materials": "Materials",
  "/tutor/lectures": "Lectures",
  "/tutor/settings": "Settings",
};

function titleForPath(pathname: string) {
  const match = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Tutor";
}

interface TutorShellProps {
  children: React.ReactNode;
}

export function TutorShell({ children }: TutorShellProps) {
  const pathname = usePathname();

  return (
    <div className="tutor-shell h-dvh overflow-hidden p-0 lg:h-screen lg:p-4">
      <div className="flex h-full flex-col lg:flex-row lg:gap-4">
        <TutorSidebar items={tutorNav} roleLabel="Tutor portal" />

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-3xl lg:border lg:border-slate-100 lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]">
          <TutorTopbar title={titleForPath(pathname)} />
          <div className="tutor-page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
