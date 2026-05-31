"use client";

import { usePathname } from "next/navigation";
import { TutorShell } from "@/components/layout/tutor-shell";
import { TutorOnboardingGuard } from "@/components/tutor/tutor-onboarding-guard";
import "./tutor-theme.css";

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
    <TutorShell>
      <TutorOnboardingGuard>{children}</TutorOnboardingGuard>
    </TutorShell>
  );
}
