"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { TutorCard } from "@/components/shared/tutor-card";
import { allTutors } from "@/lib/mock-data";

function StudentTutorsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const tutors = useMemo(() => {
    if (!q) return allTutors;
    return allTutors.filter((t) => {
      const haystack = [t.name, t.subject, ...t.subjects].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [q]);

  return (
    <>
      <StudentPageHeader
        title="Browse tutors"
        description={
          q
            ? `Showing results for “${searchParams.get("q")}”`
            : "Find verified tutors across all subjects."
        }
      />

      {tutors.length === 0 ? (
        <div className="student-empty">No tutors match your search.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tutors.map((tutor) => (
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
