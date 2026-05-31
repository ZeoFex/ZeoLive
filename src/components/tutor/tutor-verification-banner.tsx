"use client";

import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TutorVerificationBanner({
  variant,
}: {
  variant: "onboarding" | "pending" | "rejected" | "recommendation";
}) {
  if (variant === "onboarding") {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Complete your tutor verification</p>
          <p className="text-muted-foreground">
            Upload your education documents (Undergraduate, Diploma/HND, Graduate, or
            Postgraduate) to finish your application.
          </p>
          <Button size="sm" asChild>
            <Link href="/tutor/onboarding">Continue verification</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "recommendation") {
    return (
      <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Recommendation required</p>
          <p className="text-muted-foreground">
            Continuing undergraduate tutors must request a letter from their institution.
          </p>
          <Button size="sm" asChild>
            <Link href="/tutor/onboarding">Add recommender</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "rejected") {
    return (
      <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Application not approved</p>
          <p className="text-muted-foreground">
            Contact ZoeLive support if you believe this was a mistake. You can still browse
            your account or sign out to use a different login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-lg border border-blue-500/40 bg-blue-500/10 p-4">
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
      <div className="space-y-1 text-sm">
        <p className="font-medium">Verification in progress</p>
        <p className="text-muted-foreground">
          Your documents are under review. You can use the dashboard while you wait. Sign
          out anytime if you need to open another account (e.g. admin).
        </p>
      </div>
    </div>
  );
}
