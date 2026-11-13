"use client";

import { useLocalParticipant, useParticipants } from "@livekit/components-react";
import { Flag, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REPORT_REASONS } from "@/lib/session-trust";

export function ReportDialog({ roomId }: { roomId: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [open, setOpen] = useState(false);
  const [targetName, setTargetName] = useState("The class");
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const targets = useMemo(() => {
    const names = participants
      .filter((participant) => participant.identity !== localParticipant.identity)
      .map((participant) => participant.name || "Participant");
    return ["The class", ...Array.from(new Set(names))];
  }, [participants, localParticipant.identity]);

  const send = async () => {
    setSending(true);
    try {
      const response = await fetch(`/api/classroom/${roomId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ targetName, reason, details }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not send the report");
      toast.success(json.already ? "You already reported this person" : "Report sent to the admins");
      setOpen(false);
      setDetails("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the report");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
        onClick={() => setOpen(true)}
        aria-label="Report a problem in this class"
      >
        <Flag className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this class</DialogTitle>
            <DialogDescription>
              Admins receive the report. The person you name is not notified from this screen.
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm font-medium text-slate-800" htmlFor="report-target">
            Who
          </label>
          <select
            id="report-target"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            value={targetName}
            onChange={(event) => setTargetName(event.target.value)}
          >
            {targets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <label className="text-sm font-medium text-slate-800" htmlFor="report-reason">
            Reason
          </label>
          <select
            id="report-reason"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            value={reason}
            onChange={(event) => setReason(event.target.value as (typeof REPORT_REASONS)[number])}
          >
            {REPORT_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="What happened"
            maxLength={500}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
          <Button className="rounded-xl" disabled={sending} onClick={() => void send()}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send report
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
