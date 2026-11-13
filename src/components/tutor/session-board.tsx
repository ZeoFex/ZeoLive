"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { MeetingCamera } from "@/components/meetings/meeting-camera";
import { EndedMeetingActions } from "@/components/tutor/ended-meeting-actions";
import { ScheduleMeetingDialog } from "@/components/tutor/schedule-meeting-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { browserTimeZone } from "@/lib/availability";
import { isOpenMeeting, sessionHeadline, sessionTopic, type PortalSession } from "@/lib/session-card";
import { cn, formatDate } from "@/lib/utils";

function statusTag(status: string) {
  if (status === "ACTIVE") return "tutor-tag tutor-tag-violet";
  if (status === "COMPLETED") return "tutor-tag tutor-tag-emerald";
  if (status === "CANCELLED") return "tutor-tag tutor-tag-slate";
  return "tutor-tag tutor-tag-violet";
}

export function TutorSessionBoard({ kind }: { kind: "scheduling" | "booking" }) {
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const scheduling = kind === "scheduling";

  const load = () => {
    setLoading(true);
    fetch("/api/tutoring-sessions", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const rows = (data.sessions ?? []) as PortalSession[];
        setSessions(rows.filter((session) => session.shareable === scheduling));
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [scheduling]);

  const active = sessions.filter((s) => s.status === "SCHEDULED" || s.status === "ACTIVE");
  const past = sessions.filter((s) => s.status === "COMPLETED" || s.status === "CANCELLED");

  return (
    <>
      <TutorPageHeader
        title={scheduling ? "Scheduling sessions" : "Booking sessions"}
        description={
          scheduling
            ? "Create a meeting, share the link, and keep it open until you end it."
            : "Sessions students booked with you. The same date and time stays in one class."
        }
        actions={scheduling ? <ScheduleMeetingDialog onScheduled={load} /> : undefined}
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <div className="tutor-card p-8 text-center text-sm text-slate-500">
          {scheduling
            ? "No scheduling sessions yet. Create one and share the join link."
            : "No booking sessions yet. Students appear here after they book you."}
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Upcoming and live
              </h3>
              {active.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  scheduling={scheduling}
                  onChanged={load}
                />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Past</h3>
              {past.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  scheduling={scheduling}
                  past
                  onChanged={load}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}

function SessionRow({
  session,
  scheduling,
  past = false,
  onChanged,
}: {
  session: PortalSession;
  scheduling: boolean;
  past?: boolean;
  onChanged?: () => void;
}) {
  return (
    <div className="tutor-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {scheduling ? (
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
          <div className="min-w-0">
            <p className="text-base font-semibold leading-snug text-slate-900">
              {sessionHeadline(session)}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-slate-500">{sessionTopic(session)}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{formatDate(session.scheduledAt)}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {scheduling ? session.participantCount : session.participantCount + 1} of {session.seatLimit} participants
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={cn(statusTag(session.status), "shrink-0")}>
            {session.status.toLowerCase()}
          </span>
          {scheduling && !past ? (
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
          ) : null}
          {!past ? (
            <Button className="tutor-gradient-btn shrink-0 rounded-xl" asChild>
              <Link href={`/classroom/${session.roomId}`}>
                {scheduling ? "Start meeting" : "Start session"}
              </Link>
            </Button>
          ) : null}
          {!scheduling && !past && session.status === "SCHEDULED" && onChanged ? (
            <BookingScheduleActions sessionId={session.id} onChanged={onChanged} />
          ) : null}
          {!scheduling && (session.status === "COMPLETED" || session.status === "ACTIVE") ? (
            <Button variant="outline" className="tutor-outline-btn shrink-0 rounded-xl" asChild>
              <Link href={`/tutor/sessions/${session.id}`}>Class recap</Link>
            </Button>
          ) : null}
          {scheduling && session.status === "COMPLETED" ? (
            <Button variant="outline" className="tutor-outline-btn shrink-0 rounded-xl" asChild>
              <Link href={`/tutor/sessions/${session.id}`}>Class recap</Link>
            </Button>
          ) : null}
          {scheduling && past && onChanged ? (
            <EndedMeetingActions session={session} onChanged={onChanged} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BookingScheduleActions({
  sessionId,
  onChanged,
}: {
  sessionId: string;
  onChanged: () => void;
}) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ label: string; scheduledAt: string; full: boolean }[]>([]);
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const tutorId = data?.user?.id;

  useEffect(() => {
    if (!open || !tutorId || !date) return;
    const query = new URLSearchParams({ date, timeZone: browserTimeZone() });
    fetch(`/api/tutors/${tutorId}/open-slots?${query}`, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((json) => setSlots(json.slots ?? []))
      .catch(() => setSlots([]));
  }, [open, tutorId, date]);

  const reschedule = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/tutoring-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "reschedule", scheduledAt: chosen }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not reschedule");
      toast.success("Session moved. Students will get the new time.");
      setOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reschedule");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this booking for every student in the hour?")) return;
    const response = await fetch(`/api/tutoring-sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "cancel" }),
    });
    const json = await response.json();
    if (!response.ok) {
      toast.error(json.error ?? "Could not cancel the session");
      return;
    }
    toast.success("Booking session cancelled");
    onChanged();
  };

  return (
    <>
      <Button type="button" variant="outline" className="tutor-outline-btn shrink-0 rounded-xl" onClick={() => setOpen((value) => !value)}>
        Move time
      </Button>
      <Button type="button" variant="outline" className="tutor-outline-btn shrink-0 rounded-xl" onClick={cancel}>
        Cancel
      </Button>
      {open ? (
        <div className="basis-full rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-800">Move everyone to another open hour</p>
          <input
            type="date"
            className="mt-2 h-10 rounded-xl border border-slate-200 px-3 text-sm"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setChosen("");
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.scheduledAt}
                type="button"
                size="sm"
                variant={chosen === slot.scheduledAt ? "default" : "outline"}
                disabled={slot.full}
                className="rounded-xl"
                onClick={() => setChosen(slot.scheduledAt)}
              >
                {slot.full ? `${slot.label} full` : slot.label}
              </Button>
            ))}
          </div>
          <Button className="tutor-gradient-btn mt-3 rounded-xl" disabled={!chosen || busy} onClick={reschedule}>
            {busy ? "Moving…" : "Save new time"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
