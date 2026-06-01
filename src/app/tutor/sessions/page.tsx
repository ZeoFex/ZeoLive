"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PortalSession } from "@/lib/portal-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function statusTag(status: string) {
  if (status === "ACTIVE") return "tutor-tag tutor-tag-violet";
  if (status === "COMPLETED") return "tutor-tag tutor-tag-emerald";
  if (status === "CANCELLED") return "tutor-tag tutor-tag-slate";
  return "tutor-tag tutor-tag-violet";
}

export default function TutorSessionsPage() {
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutoring-sessions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const active = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
  );
  const past = sessions.filter(
    (s) => s.status === "COMPLETED" || s.status === "CANCELLED"
  );

  return (
    <>
      <TutorPageHeader
        title="Sessions"
        description="Manage your teaching sessions and join live classes."
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <div className="tutor-card p-8 text-center text-sm text-slate-500">
          No sessions yet. Students will appear here after they book you.
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Upcoming & live
              </h3>
              {active.map((session) => (
                <div key={session.id} className="tutor-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar>
                      {session.student.image ? (
                        <AvatarImage
                          src={session.student.image}
                          alt={session.student.name}
                        />
                      ) : null}
                      <AvatarFallback>{session.student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {session.title ?? session.subject ?? "Tutoring session"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {session.student.name} · {formatDate(session.scheduledAt)}
                      </p>
                    </div>
                    <span className={cn(statusTag(session.status))}>
                      {session.status.toLowerCase()}
                    </span>
                    <Button className="tutor-gradient-btn rounded-xl" asChild>
                      <Link href={`/classroom/${session.roomId}`}>Start session</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Past
              </h3>
              {past.map((session) => (
                <div key={session.id} className="tutor-card p-5 sm:p-6 opacity-90">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {session.title ?? session.subject ?? "Tutoring session"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {session.student.name} · {formatDate(session.scheduledAt)}
                      </p>
                    </div>
                    <span className={cn(statusTag(session.status))}>
                      {session.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}
