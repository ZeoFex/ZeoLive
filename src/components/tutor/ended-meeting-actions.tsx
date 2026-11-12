"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MeetingCamera } from "@/components/meetings/meeting-camera";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortalSession } from "@/lib/session-card";

export function EndedMeetingActions({
  session,
  onChanged,
}: {
  session: PortalSession;
  onChanged: () => void;
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const name = session.title?.trim() || "This meeting";

  const reschedule = async () => {
    if (!date || !time) {
      toast.error("Choose a date and time");
      return;
    }
    const [hour, minute] = time.split(":").map((part) => parseInt(part, 10));
    const [year, month, day] = date.split("-").map((part) => parseInt(part, 10));
    if ([hour, minute, year, month, day].some((part) => Number.isNaN(part))) {
      toast.error("Choose a valid time");
      return;
    }
    const scheduledAt = new Date(year, month - 1, day, hour, minute).toISOString();
    setSaving(true);
    try {
      const res = await fetch(`/api/tutor/meetings/${session.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt, title: session.title ?? undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not reschedule the meeting");
      setJoinUrl(json.joinUrl ?? "");
      toast.success("New meeting link is ready");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reschedule the meeting");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tutor/meetings/${session.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not delete the meeting");
      toast.success("Meeting deleted");
      setDeleteOpen(false);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="tutor-outline-btn rounded-xl"
          onClick={() => {
            setJoinUrl("");
            setCopied(false);
            setRescheduleOpen(true);
          }}
        >
          Reschedule
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <MeetingCamera className="h-10 w-10 rounded-xl" />
              <div>
                <DialogTitle>Reschedule meeting</DialogTitle>
                <DialogDescription className="mt-1">{name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {joinUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                This is a new link. Share it with the people who should join. The previous link
                no longer opens the meeting.
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm break-all text-slate-800">
                {joinUrl}
              </div>
              <Button
                type="button"
                className="w-full rounded-xl"
                onClick={() => {
                  void navigator.clipboard.writeText(joinUrl);
                  setCopied(true);
                  toast.success("Join link copied");
                }}
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy new link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`reschedule-date-${session.id}`}>Date</Label>
                <Input
                  id={`reschedule-date-${session.id}`}
                  type="date"
                  className="mt-1"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`reschedule-time-${session.id}`}>Time</Label>
                <Input
                  id={`reschedule-time-${session.id}`}
                  type="time"
                  className="mt-1"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={saving}
                onClick={() => void reschedule()}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create new link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this meeting?</DialogTitle>
            <DialogDescription>
              {name} will be removed from your sessions. A recording saved from it is removed too.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Keep it
            </Button>
            <Button type="button" variant="destructive" disabled={saving} onClick={() => void remove()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
