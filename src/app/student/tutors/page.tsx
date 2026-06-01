"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { TutorCard } from "@/components/shared/tutor-card";
import type { Tutor } from "@/types";

function StudentTutorsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutors", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setTutors(data.tutors ?? []))
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!q) return tutors;
    return tutors.filter((t) => {
      const haystack = [t.name, t.subject, ...t.subjects].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [q, tutors]);

  return (
    <>
      <StudentPageHeader
        title="Browse tutors"
        description={
          q
            ? `Showing results for “${searchParams.get("q")}”`
            : "Find verified tutors who are approved to teach on ZoeLive."
        }
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading tutors…</p>
      ) : filtered.length === 0 ? (
        <div className="student-empty">
          {tutors.length === 0
            ? "No approved tutors yet. Check back after tutors complete verification."
            : "No tutors match your search."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </>
  );
}

export default function StudentTutorsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <StudentTutorsContent />
    </Suspense>
  );
}
