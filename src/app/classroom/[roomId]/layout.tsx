"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

/** Block unapproved tutors from live classroom (students always allowed). */
export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.role !== "TUTOR") {
      setAllowed(true);
      return;
    }

    fetch("/api/tutor/onboarding/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.verificationStatus === "APPROVED") {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
      })
      .catch(() => setAllowed(false));
  }, [session, status]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyTop: body.style.top,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.top = "0";
    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.width = previous.bodyWidth;
      body.style.height = previous.bodyHeight;
      body.style.top = previous.bodyTop;
    };
  }, []);

  if (status === "loading" || allowed === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background text-sm text-muted-foreground">
        Loading classroom…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden bg-background p-8 text-center">
        <h1 className="text-lg font-semibold">Tutor account not approved yet</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          You can join live sessions after an admin approves your tutor application.
        </p>
        <Button onClick={() => router.push(routes.tutor.dashboard)}>
          Back to dashboard
        </Button>
        <Button variant="ghost" asChild>
          <Link href={routes.home}>Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex h-[100svh] max-h-[100svh] flex-col overflow-hidden overscroll-none bg-background">
      {children}
    </div>
  );
}
