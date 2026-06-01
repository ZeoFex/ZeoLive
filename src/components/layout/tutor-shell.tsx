"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TutorSidebar } from "@/components/layout/tutor-sidebar";
import { TutorTopbar } from "@/components/layout/tutor-topbar";
import { tutorNav } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/tutor/dashboard": "Dashboard",
  "/tutor/students": "Students",
  "/tutor/sessions": "Sessions",
  "/tutor/earnings": "Earnings",
  "/tutor/availability": "Availability",
  "/tutor/materials": "Materials",
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
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    fetch("/api/tutoring-sessions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const sessions = data.sessions ?? [];
        setUpcomingCount(
          sessions.filter(
            (s: { status: string }) =>
              s.status === "SCHEDULED" || s.status === "ACTIVE"
          ).length
        );
      })
      .catch(() => setUpcomingCount(0));
  }, [pathname]);

  return (
    <div className="tutor-shell min-h-screen p-0 lg:p-4">
      <div className="flex min-h-screen flex-col lg:min-h-[calc(100vh-2rem)] lg:flex-row lg:gap-4">
        <TutorSidebar
          items={tutorNav}
          roleLabel="Tutor portal"
          upcomingCount={upcomingCount}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-3xl lg:border lg:border-slate-100 lg:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]">
          <TutorTopbar title={titleForPath(pathname)} />
          <div className="tutor-page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
