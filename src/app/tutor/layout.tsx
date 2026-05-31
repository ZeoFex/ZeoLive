"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TutorOnboardingGuard } from "@/components/tutor/tutor-onboarding-guard";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/tutor/onboarding")) {
    return <>{children}</>;
  }

  return (
    <DashboardShell role="tutor" roleLabel="Tutor">
      <TutorOnboardingGuard>{children}</TutorOnboardingGuard>
    </DashboardShell>
  );
}
