"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutToAppPath } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

type GuardState =
  | "loading"
  | "redirecting"
  | "ready"
  | "pending"
  | "awaiting-recommendation"
  | "rejected";

export function TutorOnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    fetch("/api/tutor/onboarding/status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.onboardingComplete) {
          if (!pathname.startsWith(routes.tutor.onboarding)) {
            router.replace(routes.tutor.onboarding);
            setState("redirecting");
            return;
          }
          setState("ready");
          return;
        }

        if (data.verificationStatus === "APPROVED") {
          setState("ready");
          return;
        }

        if (data.verificationStatus === "REJECTED") {
          setState("rejected");
          return;
        }

        if (data.verificationStatus === "AWAITING_RECOMMENDATION") {
          setState("awaiting-recommendation");
          return;
        }

        setState("pending");
      })
      .catch(() => setState("ready"));
  }, [pathname, router]);

  if (state === "loading" || state === "redirecting") {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <TutorBlockedScreen
        title="Application not approved"
        description="Your tutor application was not approved. Contact Zeolive support if you believe this was a mistake."
      />
    );
  }

  if (state === "awaiting-recommendation") {
    return (
      <TutorBlockedScreen
        title="Waiting for recommendation"
        description="We emailed your faculty recommender. You can use the dashboard after they submit their letter and an admin approves your profile."
        action={
          <Button variant="outline" asChild>
            <Link href={routes.tutor.onboarding}>View recommender step</Link>
          </Button>
        }
      />
    );
  }

  if (state === "pending") {
    return (
      <TutorBlockedScreen
        title="Verification in progress"
        description="Your documents are with our admin team. You will receive an email when your tutor account is approved."
      />
    );
  }

  return <>{children}</>;
}

function TutorBlockedScreen({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="tutor-card max-w-md p-8">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {action}
          <Button variant="outline" className="tutor-outline-btn rounded-xl" onClick={() => void signOutToAppPath(routes.login)}>
            Sign out
          </Button>
          <Button variant="ghost" asChild>
            <Link href={routes.home}>Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
