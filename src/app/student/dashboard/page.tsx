"use client";

import { BookOpen, Clock, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { StudentStatCard } from "@/components/shared/student-stat-card";
import { TutorCard } from "@/components/shared/tutor-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PortalSession } from "@/lib/portal-data";
import { routes } from "@/lib/routes";
import type { Tutor } from "@/types";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  href: string;
}

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const [upcoming, setUpcoming] = useState<PortalSession[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    completedCount: 0,
    tutorCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tutoring-sessions", { credentials: "same-origin" }).then((r) =>
        r.json()
      ),
      fetch("/api/tutors", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/student/notifications", { credentials: "same-origin" }).then((r) =>
        r.json()
      ),
    ])
      .then(([sessionsData, tutorsData, notifData]) => {
        const allSessions = (sessionsData.sessions ?? []) as PortalSession[];
        const upcomingSessions = allSessions.filter(
          (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
        );
        setUpcoming(upcomingSessions);
        setStats({
          upcomingCount: upcomingSessions.length,
          completedCount: allSessions.filter((s) => s.status === "COMPLETED").length,
          tutorCount: new Set(allSessions.map((s) => s.tutor.id)).size,
        });
        setTutors((tutorsData.tutors ?? []).slice(0, 3));
        setNotifications((notifData.items ?? []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <StudentPageHeader
        title={`Welcome back, ${firstName}!`}
        description="Ready to learn? Here's your overview."
        actions={
          <Button className="student-gradient-btn w-full rounded-xl sm:w-auto" asChild>
            <Link href={routes.student.book}>
              <Plus className="mr-2 h-4 w-4" />
              Book session
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StudentStatCard title="Upcoming" value={stats.upcomingCount} icon={BookOpen} />
        <StudentStatCard
          title="Completed"
          value={stats.completedCount}
          icon={Clock}
        />
        <StudentStatCard title="Tutors" value={stats.tutorCount} icon={Users} />
        <StudentStatCard
          title="On platform"
          value={tutors.length > 0 ? "Active" : "—"}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="student-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">Upcoming sessions</h3>
            <Button variant="ghost" size="sm" className="text-blue-600" asChild>
              <Link href={routes.student.classes}>View all</Link>
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
              No sessions booked yet.{" "}
              <Link href={routes.student.book} className="font-medium text-blue-600">
                Find a tutor
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="student-session-card flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      {s.tutor.image ? (
                        <AvatarImage src={s.tutor.image} alt={s.tutor.name} />
                      ) : null}
                      <AvatarFallback>{s.tutor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {s.title ?? s.subject ?? "Session"}
                      </p>
                      <p className="truncate text-xs text-slate-500 sm:text-sm">
                        {s.tutor.name} · {formatDate(s.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="student-gradient-btn w-full shrink-0 rounded-xl sm:w-auto"
                    size="sm"
                    asChild
                  >
                    <Link href={`/classroom/${s.roomId}`}>Join</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="student-card p-4 sm:p-6">
          <h3 className="mb-4 font-bold text-slate-900">Getting started</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 px-4 py-3">
              1. Browse verified tutors and pick a subject.
            </li>
            <li className="rounded-xl bg-slate-50 px-4 py-3">
              2. Book a time slot for your live session.
            </li>
            <li className="rounded-xl bg-slate-50 px-4 py-3">
              3. Join the classroom from your sessions list.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 lg:mt-8">
        <h3 className="mb-4 font-bold text-slate-900">Available tutors</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading tutors…</p>
        ) : tutors.length === 0 ? (
          <div className="student-empty text-sm text-slate-500">
            No approved tutors on the platform yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="student-card mt-6 p-4 sm:p-6">
          <h3 className="mb-4 font-bold text-slate-900">Recent notifications</h3>
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className="block rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm transition-colors hover:bg-sky-50/50"
              >
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
