"use client";

import { DollarSign, Star, Users, Video } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatCard } from "@/components/shared/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tutorSessions } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TutorDashboardPage() {
  const upcoming = tutorSessions.filter((s) => s.status === "upcoming");

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back, Dr. Sarah Chen"
        userName="Dr. Sarah Chen"
        userAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="This month" value={formatCurrency(2400)} icon={DollarSign} trend="+18%" />
          <StatCard title="Upcoming" value={upcoming.length} icon={Video} />
          <StatCard title="Total students" value="24" icon={Users} />
          <StatCard title="Rating" value="4.9" icon={Star} />
        </div>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming classes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tutor/sessions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-4 rounded-xl border p-4">
                <Avatar>
                  <AvatarImage src={s.tutorAvatar} alt={s.tutorName} />
                  <AvatarFallback>{s.tutorName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{s.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.tutorName} · {formatDate(s.date)} at {s.time}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/classroom/demo">Start session</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Student analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Alex Morgan", sessions: 12, progress: "Excellent" },
                { name: "Maria Garcia", sessions: 8, progress: "Good" },
                { name: "John Smith", sessions: 5, progress: "Improving" },
              ].map((s) => (
                <div key={s.name} className="flex justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.sessions} sessions · {s.progress}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="rounded-lg bg-muted/50 p-4">
                &ldquo;Best calculus tutor I&apos;ve ever had!&rdquo; — Alex M.
              </p>
              <p className="rounded-lg bg-muted/50 p-4">
                &ldquo;Very patient and explains concepts clearly.&rdquo; — Maria G.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
