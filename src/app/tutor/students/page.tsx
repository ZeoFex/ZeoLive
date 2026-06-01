"use client";

import { useEffect, useState } from "react";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StudentRow = {
  id: string;
  name: string;
  image: string | null;
  subjects: string[];
  sessionCount: number;
};

export default function TutorStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutor/students", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setStudents(data.students ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TutorPageHeader
        title="Students"
        description="Students who have booked sessions with you."
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="tutor-card px-6 py-12 text-center text-sm text-slate-500">
          No students yet. When someone books a session with you, they will appear here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <div key={s.id} className="tutor-card flex items-center gap-4 p-5 sm:p-6">
              <Avatar className="h-14 w-14">
                {s.image ? <AvatarImage src={s.image} alt={s.name} /> : null}
                <AvatarFallback>{s.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-900">{s.name}</p>
                <p className="text-sm text-slate-500">
                  {s.subjects.join(", ") || "Sessions"} · {s.sessionCount} booked
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
