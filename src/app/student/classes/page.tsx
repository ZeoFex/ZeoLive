"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sessionTopic, type PortalSession } from "@/lib/session-card";
import { formatDate } from "@/lib/utils";

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return { label: "live", variant: "default" as const };
    case "COMPLETED":
      return { label: "completed", variant: "secondary" as const };
    case "CANCELLED":
      return { label: "cancelled", variant: "destructive" as const };
    default:
      return { label: "upcoming", variant: "outline" as const };
  }
}

function SessionList({ sessions }: { sessions: PortalSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="student-empty py-10 text-center text-sm text-slate-500">
        No sessions found.{" "}
        <Link href="/student/book" className="font-medium text-blue-600 hover:underline">
          Book a tutor
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const { label, variant } = statusLabel(session.status);
        const canJoin =
          session.status === "SCHEDULED" || session.status === "ACTIVE";

        return (
          <div key={session.id} className="student-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  {session.tutor.image ? (
                    <AvatarImage src={session.tutor.image} alt={session.tutor.name} />
                  ) : null}
                  <AvatarFallback className="text-sm font-semibold">
                    {session.tutor.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-snug text-slate-900">
                    {session.tutor.name}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">
                    {sessionTopic(session)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {formatDate(session.scheduledAt)}
                  </p>
                  <div className="mt-2">
                    <Badge variant={variant}>{label}</Badge>
                  </div>
                </div>
              </div>
              {canJoin && (
                <Button
                  className="student-gradient-btn w-full shrink-0 rounded-xl sm:w-auto"
                  asChild
                >
                  <Link href={`/classroom/${session.roomId}`}>Join session</Link>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudentClassesPage() {
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutoring-sessions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
  );
  const completed = sessions.filter(
    (s) => s.status === "COMPLETED" || s.status === "CANCELLED"
  );

  return (
    <>
      <StudentPageHeader
        title="Your sessions"
        description="Manage upcoming and completed learning sessions."
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading sessions…</p>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="student-tabs-list student-mobile-nav mb-4 h-auto w-full max-w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="upcoming" className="student-tab-trigger shrink-0 rounded-lg px-4">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="student-tab-trigger shrink-0 rounded-lg px-4">
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <SessionList sessions={upcoming} />
          </TabsContent>
          <TabsContent value="completed">
            <SessionList sessions={completed} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
