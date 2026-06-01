"use client";

import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Classroom, type ClassroomSessionInfo } from "@/components/livekit/Classroom";
import { Button } from "@/components/ui/button";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { dashboardForRole } from "@/lib/routes";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; session: ClassroomSessionInfo };

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });

  const participantRole =
    pageState.status === "ready" ? pageState.session.participantRole : null;

  const { state: tokenState, refetch: refetchToken } = useLiveKitToken(
    pageState.status === "ready" ? roomId : null,
    participantRole
  );

  useEffect(() => {
    if (!roomId) {
      setPageState({ status: "error", message: "Invalid classroom link" });
      return;
    }

    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/classroom/${roomId}`)}`);
      return;
    }

    let cancelled = false;

    async function loadSession() {
      setPageState({ status: "loading" });
      try {
        const res = await fetch(`/api/classroom/${roomId}`, {
          credentials: "same-origin",
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            typeof json.error === "string" ? json.error : "Cannot access this session"
          );
        }

        if (!cancelled) {
          setPageState({
            status: "ready",
            session: {
              roomId: json.roomId,
              title: json.title ?? "Tutoring session",
              subject: json.subject,
              status: json.status,
              participantRole: json.participantRole,
            },
          });
        }
      } catch (e) {
        if (!cancelled) {
          setPageState({
            status: "error",
            message: e instanceof Error ? e.message : "Cannot access this session",
          });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [roomId, authStatus, router]);

  if (authStatus === "loading" || pageState.status === "loading") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connecting to classroom…</p>
      </div>
    );
  }

  if (pageState.status === "error") {
    const dashboard =
      authSession?.user?.role != null
        ? dashboardForRole(authSession.user.role)
        : "/";

    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-lg font-semibold">Cannot join session</h1>
        <p className="max-w-md text-sm text-muted-foreground">{pageState.message}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            Try again
          </Button>
          <Button asChild>
            <Link href={dashboard}>Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (tokenState.status === "loading" || tokenState.status === "idle") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing secure connection…</p>
      </div>
    );
  }

  if (tokenState.status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-lg font-semibold">Connection failed</h1>
        <p className="max-w-md text-sm text-muted-foreground">{tokenState.message}</p>
        <div className="flex gap-2">
          <Button onClick={() => refetchToken()}>Retry connection</Button>
          <Button variant="outline" asChild>
            <Link href={dashboardForRole(authSession?.user?.role ?? "STUDENT")}>
              Leave
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (pageState.session.status === "COMPLETED") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
        <h1 className="text-lg font-semibold">Session ended</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This tutoring session is no longer active.
        </p>
        <Button asChild>
          <Link href={dashboardForRole(authSession?.user?.role ?? "STUDENT")}>
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Classroom
      token={tokenState.token}
      serverUrl={tokenState.serverUrl}
      session={pageState.session}
    />
  );
}
