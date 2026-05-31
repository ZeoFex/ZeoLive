"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export function SignedInSignupNotice({
  targetRole,
}: {
  targetRole: "student" | "tutor";
}) {
  const { data: session } = useSession();
  const currentRole = session?.user?.role?.toLowerCase();

  if (!session?.user) return null;

  if (currentRole === targetRole) {
    return (
      <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm">
        <p className="font-medium">You already have a {targetRole} account</p>
        <p className="mt-1 text-muted-foreground">
          Signed in as {session.user.email}. Go to your dashboard instead of
          registering again.
        </p>
        <Button size="sm" className="mt-3" asChild>
          <Link
            href={
              targetRole === "tutor"
                ? routes.tutor.dashboard
                : routes.student.dashboard
            }
          >
            Open dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium">
        Signed in as {session.user.email} ({currentRole})
      </p>
      <p className="mt-1 text-muted-foreground">
        To apply as a {targetRole}, use a <strong>different email</strong> below, or sign
        out first. Submitting this form will sign you in as the new {targetRole} account.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() =>
          signOut({
            callbackUrl:
              targetRole === "tutor" ? routes.signupTutor : routes.signupStudent,
          })
        }
      >
        Sign out and start fresh
      </Button>
    </div>
  );
}
