"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

type RecapSession = {
  id: string;
  roomId: string;
  title: string | null;
  subject: string | null;
  status: string;
  scheduledAt: string;
  seatLimit: number;
  seatsTaken: number;
  recap: string;
  canEditRecap: boolean;
  tutorName: string;
  studentName: string;
  shareable: boolean;
  materials: {
    id: string;
    title: string;
    fileUrl: string;
    fileName: string;
    mimeType: string | null;
    createdAt: string;
    whiteboard: boolean;
  }[];
  recordings: { id: string; title: string; createdAt: string; durationSeconds: number | null }[];
  attendance: { displayName: string; role: string; joinedAt: string }[];
  canReview: boolean;
  myReview: { rating: number; comment: string } | null;
  reviews: { id: string; rating: number; comment: string; studentName: string; createdAt: string }[];
};

export function SessionRecap({
  sessionId,
  backHref,
  recordingsHref,
  materialsHref,
}: {
  sessionId: string;
  backHref: string;
  recordingsHref: string;
  materialsHref: string;
}) {
  const [session, setSession] = useState<RecapSession | null>(null);
  const [recap, setRecap] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/tutoring-sessions/${sessionId}`, { credentials: "same-origin" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Could not load this class");
        setSession({
          ...json,
          attendance: json.attendance ?? [],
          reviews: json.reviews ?? [],
          materials: json.materials ?? [],
          canReview: json.canReview === true,
        });
        setRecap(json.recap ?? "");
        setRating(json.myReview?.rating ?? 0);
        setComment(json.myReview?.comment ?? "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load this class"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/tutoring-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "recap", recap }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not save the recap");
      toast.success("Class recap saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the recap");
    } finally {
      setSaving(false);
    }
  };

  const saveRating = async () => {
    if (rating < 1) {
      toast.error("Choose a rating from 1 to 5");
      return;
    }
    setRatingSaving(true);
    try {
      const response = await fetch(`/api/tutoring-sessions/${sessionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ rating, comment }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not save your rating");
      toast.success("Rating saved");
      setSession((current) =>
        current ? { ...current, myReview: { rating, comment } } : current
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your rating");
    } finally {
      setRatingSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading class recap…</p>;
  if (!session) return <p className="text-sm text-slate-500">This class could not be opened.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={backHref} className="text-sm font-medium text-blue-600">
          Back to sessions
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {session.subject?.trim() || session.title?.trim() || "Class recap"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {session.tutorName} · {formatDate(session.scheduledAt)} · {session.seatsTaken} of {session.seatLimit} seats
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Notes from class</h2>
        {session.canEditRecap ? (
          <>
            <Textarea
              className="mt-3 min-h-40"
              value={recap}
              onChange={(event) => setRecap(event.target.value)}
              placeholder="What you covered, what to practise, and what comes next."
            />
            <Button className="mt-3 rounded-xl" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save recap"}
            </Button>
          </>
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {session.recap.trim() || "Your tutor has not written a recap yet."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Whiteboard and files</h2>
          <Link href={materialsHref} className="text-sm font-medium text-blue-600">
            Materials
          </Link>
        </div>
        {session.materials.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No whiteboard or file is attached to this class yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {session.materials.map((material) => {
              const image = material.whiteboard || material.mimeType?.startsWith("image/");
              return (
                <li key={material.id} className="rounded-xl bg-slate-50 p-3">
                  <a href={material.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-900">
                    {material.whiteboard ? "Saved whiteboard" : material.title}
                  </a>
                  {image ? (
                    <img src={material.fileUrl} alt="" className="mt-2 max-h-80 w-full rounded-lg bg-white object-contain" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {session.canEditRecap && session.status !== "CANCELLED" ? (
          <label className="mt-4 inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            {fileBusy ? "Adding file…" : "Add a file for this class"}
            <input
              type="file"
              className="sr-only"
              disabled={fileBusy}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setFileBusy(true);
                const body = new FormData();
                body.set("file", file);
                body.set("title", file.name);
                fetch(`/api/tutoring-sessions/${sessionId}/materials`, {
                  method: "POST",
                  credentials: "same-origin",
                  body,
                })
                  .then(async (response) => {
                    const json = await response.json();
                    if (!response.ok) throw new Error(json.error ?? "Could not add this file");
                    toast.success("File added to this class");
                    const reload = await fetch(`/api/tutoring-sessions/${sessionId}`, { credentials: "same-origin" });
                    const next = await reload.json();
                    if (reload.ok) {
                      setSession((current) => (current ? { ...current, materials: next.materials ?? [] } : current));
                    }
                  })
                  .catch((error) => toast.error(error instanceof Error ? error.message : "Could not add this file"))
                  .finally(() => setFileBusy(false));
              }}
            />
          </label>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Who attended</h2>
        {session.attendance.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nobody has joined this class yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {session.attendance.map((person) => (
              <li
                key={`${person.role}-${person.displayName}-${person.joinedAt}`}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-900">{person.displayName}</span>
                <span className="text-xs capitalize text-slate-500">
                  {person.role} · {formatDate(person.joinedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {session.status === "COMPLETED" && !session.canEditRecap && !session.canReview && !session.myReview ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Rate this class</h2>
          <p className="mt-3 text-sm text-slate-500">
            A rating opens after you join the class and the tutor ends it.
          </p>
        </section>
      ) : null}

      {session.canReview ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Rate this class</h2>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`h-10 w-10 rounded-full text-sm font-semibold ${
                  rating >= value ? "bg-amber-400 text-slate-900" : "bg-slate-100 text-slate-500"
                }`}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                {value}
              </button>
            ))}
          </div>
          <Textarea
            className="mt-3 min-h-24"
            value={comment}
            maxLength={500}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What went well, and what should the next class cover?"
          />
          <Button className="mt-3 rounded-xl" disabled={ratingSaving} onClick={() => void saveRating()}>
            {ratingSaving ? "Saving…" : session.myReview ? "Update rating" : "Save rating"}
          </Button>
        </section>
      ) : null}

      {session.reviews.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Student ratings</h2>
          <ul className="mt-3 space-y-2">
            {session.reviews.map((review) => (
              <li key={review.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">
                  {review.studentName} · {review.rating} of 5
                </p>
                {review.comment ? <p className="mt-1 whitespace-pre-wrap">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Recordings</h2>
          <Link href={recordingsHref} className="text-sm font-medium text-blue-600">
            Open library
          </Link>
        </div>
        {session.recordings.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No recording is attached to this class yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {session.recordings.map((recording) => (
              <li key={recording.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{recording.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDate(recording.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
