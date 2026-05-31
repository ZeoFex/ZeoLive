"use client";

import { DollarSign, Star, Users, Video } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { TutorStatCard } from "@/components/shared/tutor-stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { tutorSessions } from "@/lib/mock-data";
import { routes } from "@/lib/routes";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TutorDashboardPage() {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "Tutor";
  const upcoming = tutorSessions.filter((s) => s.status === "upcoming");

  return (
    <>
      <TutorPageHeader
        title={`Welcome back, ${displayName}`}
        description="Track your sessions, earnings, and student progress from one place."
        actions={
          <Button className="tutor-gradient-btn rounded-xl" asChild>
            <Link href={routes.tutor.availability}>Update availability</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TutorStatCard
          title="This month"
          value={formatCurrency(2400)}
          icon={DollarSign}
          trend="+18% vs last month"
        />
        <TutorStatCard title="Upcoming" value={upcoming.length} icon={Video} />
        <TutorStatCard title="Total students" value="24" icon={Users} />
        <TutorStatCard title="Rating" value="4.9" icon={Star} trend="Based on 47 reviews" />
      </div>

      <div className="tutor-card mt-6 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Upcoming classes</h3>
          <Button variant="ghost" size="sm" className="text-violet-600" asChild>
            <Link href={routes.tutor.sessions}>View all</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {upcoming.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <Avatar>
                <AvatarImage src={s.tutorAvatar} alt={s.tutorName} />
                <AvatarFallback>{s.tutorName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{s.subject}</p>
                <p className="text-sm text-slate-500">
                  {s.tutorName} · {formatDate(s.date)} at {s.time}
                </p>
              </div>
              <Button className="tutor-gradient-btn rounded-xl" asChild>
                <Link href="/classroom/demo">Start session</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="tutor-card p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-slate-900">Student analytics</h3>
          <div className="space-y-3">
            {[
              { name: "Alex Morgan", sessions: 12, progress: "Excellent" },
              { name: "Maria Garcia", sessions: 8, progress: "Good" },
              { name: "John Smith", sessions: 5, progress: "Improving" },
            ].map((s) => (
              <div
                key={s.name}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-900">{s.name}</span>
                <span className="text-slate-500">
                  {s.sessions} sessions · {s.progress}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="tutor-card p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-slate-900">Recent reviews</h3>
          <div className="space-y-3 text-sm">
            <p className="rounded-xl bg-slate-50 p-4 text-slate-700">
              &ldquo;Best calculus tutor I&apos;ve ever had!&rdquo; — Alex M.
            </p>
            <p className="rounded-xl bg-slate-50 p-4 text-slate-700">
              &ldquo;Very patient and explains concepts clearly.&rdquo; — Maria G.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
