"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { MeetingCamera } from "@/components/meetings/meeting-camera";
import { EndedMeetingActions } from "@/components/tutor/ended-meeting-actions";
import { ScheduleMeetingDialog } from "@/components/tutor/schedule-meeting-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { isOpenMeeting, sessionHeadline, sessionTopic, type PortalSession } from "@/lib/session-card";
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

  const load = () => {
    setLoading(true);
    fetch("/api/tutoring-sessions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
        description="Schedule a meeting, send the join link, and start the class."
        actions={<ScheduleMeetingDialog onScheduled={load} />}
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
                <div key={session.id} className="tutor-card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {session.shareable ? (
                        <MeetingCamera />
                      ) : (
                      <Avatar className="h-12 w-12 shrink-0">
                        {!isOpenMeeting(session) && session.student.image ? (
                          <AvatarImage
                            src={session.student.image}
                            alt={session.student.name}
                          />
                        ) : null}
                        <AvatarFallback className="text-sm font-semibold">
                          {sessionHeadline(session)[0]}
                        </AvatarFallback>
                      </Avatar>
                      )}
                      <div className="min-w-0">
                        <p className="text-base font-semibold leading-snug text-slate-900">
                          {sessionHeadline(session)}
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-slate-500">
                          {sessionTopic(session)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {formatDate(session.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className={cn(statusTag(session.status))}>
                        {session.status.toLowerCase()}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="tutor-outline-btn shrink-0 rounded-xl"
                        onClick={() => {
                          const link = `${window.location.origin}/join/${session.roomId}`;
                          void navigator.clipboard.writeText(link);
                          toast.success("Join link copied");
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy link
                      </Button>
                      <Button className="tutor-gradient-btn shrink-0 rounded-xl" asChild>
                        <Link href={`/classroom/${session.roomId}`}>Start session</Link>
                      </Button>
                    </div>
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
                <div key={session.id} className="tutor-card p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {session.shareable ? (
                        <MeetingCamera />
                      ) : (
                        <Avatar className="h-12 w-12 shrink-0">
                          {!isOpenMeeting(session) && session.student.image ? (
                            <AvatarImage src={session.student.image} alt={session.student.name} />
                          ) : null}
                          <AvatarFallback className="text-sm font-semibold">
                            {sessionHeadline(session)[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-snug text-slate-900">
                          {sessionHeadline(session)}
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-slate-500">
                          {sessionTopic(session)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {formatDate(session.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className={cn(statusTag(session.status), "shrink-0")}>
                        {session.status.toLowerCase()}
                      </span>
                      {session.shareable ? (
                        <EndedMeetingActions session={session} onChanged={load} />
                      ) : null}
                    </div>
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
