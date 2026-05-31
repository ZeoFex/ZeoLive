"use client";

import { BookOpen, Clock, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { StudentStatCard } from "@/components/shared/student-stat-card";
import { TutorCard } from "@/components/shared/tutor-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { featuredTutors, studentSessions } from "@/lib/mock-data";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/utils";
import { getStudentNotifications } from "@/lib/student-portal";

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const upcoming = studentSessions.filter((s) => s.status === "upcoming");
  const notifications = getStudentNotifications().slice(0, 3);

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
        <StudentStatCard title="Upcoming" value={upcoming.length} icon={BookOpen} />
        <StudentStatCard title="Hours learned" value="48h" icon={Clock} trend="+12% this month" />
        <StudentStatCard title="Tutors" value="6" icon={Users} />
        <StudentStatCard title="Progress" value="72%" icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="student-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">Upcoming sessions</h3>
            <Button variant="ghost" size="sm" className="text-violet-600" asChild>
              <Link href={routes.student.classes}>View all</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {upcoming.map((session) => (
              <div key={session.id} className="student-session-card flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
                    <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{session.subject}</p>
                    <p className="truncate text-xs text-slate-500 sm:text-sm">
                      {session.tutorName} · {formatDate(session.date)} · {session.time}
                    </p>
                  </div>
                </div>
                <Button className="student-gradient-btn w-full shrink-0 rounded-xl sm:w-auto" size="sm" asChild>
                  <Link href="/classroom/demo">Join</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="student-card p-4 sm:p-6">
          <h3 className="mb-4 font-bold text-slate-900">Learning progress</h3>
          <div className="space-y-5">
            {[
              { subject: "Mathematics", progress: 85 },
              { subject: "Physics", progress: 62 },
              { subject: "Python", progress: 45 },
            ].map((item) => (
              <div key={item.subject}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{item.subject}</span>
                  <span className="text-slate-500">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 lg:mt-8">
        <h3 className="mb-4 font-bold text-slate-900">Recommended tutors</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featuredTutors.slice(0, 3).map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      </div>

      <div className="student-card mt-6 p-4 sm:p-6">
        <h3 className="mb-4 font-bold text-slate-900">Recent notifications</h3>
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className="block rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm transition-colors hover:bg-violet-50/50"
            >
              <p className="font-medium text-slate-900">{n.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
