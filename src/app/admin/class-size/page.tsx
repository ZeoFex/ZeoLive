"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type TutorLimit = { id: string; name: string; email: string; participantLimit: number };
type LimitRequest = {
  id: string;
  tutorName: string;
  requestedLimit: number;
  note: string;
  createdAt: string;
};

export default function AdminClassSizePage() {
  const [tutors, setTutors] = useState<TutorLimit[]>([]);
  const [requests, setRequests] = useState<LimitRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/class-size", { credentials: "same-origin" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not load class sizes");
      const next = (json.tutors ?? []) as TutorLimit[];
      setTutors(next);
      setDrafts(Object.fromEntries(next.map((tutor) => [tutor.id, String(tutor.participantLimit)])));
      setRequests(json.requests ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load class sizes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (tutorId: string) => {
    const participantLimit = Number(drafts[tutorId]);
    const response = await fetch("/api/admin/class-size", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "set", tutorId, participantLimit }),
    });
    const json = await response.json();
    if (!response.ok) {
      toast.error(json.error ?? "Could not save the class size");
      return;
    }
    toast.success("Class size saved");
    void load();
  };

  const review = async (requestId: string, action: "approve" | "decline") => {
    const response = await fetch("/api/admin/class-size", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action, requestId }),
    });
    const json = await response.json();
    if (!response.ok) {
      toast.error(json.error ?? "Could not update the request");
      return;
    }
    toast.success(action === "approve" ? "Class size updated" : "Request declined");
    void load();
  };

  return (
    <>
      <AdminPageHeader
        title="Class size"
        description="Each tutor can host 50 participants in a meeting or a booking hour. Raise the number when they need more."
      />
      {loading ? (
        <p className="text-sm text-slate-500">Loading class sizes…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-bold text-slate-900">Requests</h2>
            {requests.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No open requests.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {requests.map((row) => (
                  <li key={row.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">
                      {row.tutorName} asked for {row.requestedLimit} participants
                    </p>
                    {row.note ? <p className="mt-1 text-sm text-slate-600">{row.note}</p> : null}
                    <p className="mt-1 text-xs text-slate-400">{formatDate(row.createdAt)}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="rounded-xl" onClick={() => void review(row.id, "approve")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void review(row.id, "decline")}>
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Tutors</h2>
            {tutors.map((tutor) => (
              <div key={tutor.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{tutor.name}</p>
                  <p className="text-xs text-slate-500">{tutor.email}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm"
                  value={drafts[tutor.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [tutor.id]: event.target.value }))}
                />
                <Button size="sm" className="rounded-xl" onClick={() => void save(tutor.id)}>
                  Save
                </Button>
              </div>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
