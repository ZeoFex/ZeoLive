"use client";

import { Users, Video } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { TutorStatCard } from "@/components/shared/tutor-stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PortalSession } from "@/lib/portal-data";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/utils";

export default function TutorDashboardPage() {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "Tutor";

  const [upcoming, setUpcoming] = useState<PortalSession[]>([]);
  const [students, setStudents] = useState<
    { id: string; name: string; image: string | null; sessionCount: number }[]
  >([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    studentCount: 0,
    completedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tutoring-sessions", { credentials: "same-origin" }).then((r) =>
        r.json()
      ),
      fetch("/api/tutor/students", { credentials: "same-origin" }).then((r) =>
        r.json()
      ),
    ])
      .then(([sessionsData, studentsData]) => {
        const allSessions = (sessionsData.sessions ?? []) as PortalSession[];
        const upcomingSessions = allSessions.filter(
          (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
        );
        setUpcoming(upcomingSessions);
        setStudents(studentsData.students ?? []);
        setStats({
          upcomingCount: upcomingSessions.length,
          studentCount: (studentsData.students ?? []).length,
          completedCount: allSessions.filter((s) => s.status === "COMPLETED").length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TutorPageHeader
        title={`Welcome back, ${displayName}`}
        description="Track your sessions and students from one place."
        actions={
          <Button className="tutor-gradient-btn rounded-xl" asChild>
            <Link href={routes.tutor.availability}>Update availability</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TutorStatCard title="Upcoming" value={stats.upcomingCount} icon={Video} />
        <TutorStatCard title="Students" value={stats.studentCount} icon={Users} />
        <TutorStatCard
          title="Completed"
          value={stats.completedCount}
          icon={Video}
        />
      </div>

      <div className="tutor-card mt-6 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Upcoming classes</h3>
          <Button variant="ghost" size="sm" className="text-violet-600" asChild>
            <Link href={routes.tutor.sessions}>View all</Link>
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
            No sessions scheduled yet. Students will see you here after they book.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <Avatar>
                  {s.student.image ? (
                    <AvatarImage src={s.student.image} alt={s.student.name} />
                  ) : null}
                  <AvatarFallback>{s.student.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {s.title ?? s.subject ?? "Session"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {s.student.name} · {formatDate(s.scheduledAt)}
                  </p>
                </div>
                <Button className="tutor-gradient-btn rounded-xl" asChild>
                  <Link href={`/classroom/${s.roomId}`}>Start session</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tutor-card mt-6 p-5 sm:p-6">
        <h3 className="mb-4 text-base font-bold text-slate-900">Your students</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-500">
            Students who book sessions with you will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {students.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-900">{s.name}</span>
                <span className="text-slate-500">{s.sessionCount} session(s)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
