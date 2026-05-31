"use client";

import { BookOpen, Clock, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { StatCard } from "@/components/shared/stat-card";
import { TutorCard } from "@/components/shared/tutor-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { featuredTutors, studentSessions } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function StudentDashboardPage() {
  const upcoming = studentSessions.filter((s) => s.status === "upcoming");

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back, Alex! Ready to learn?"
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Upcoming Sessions" value={upcoming.length} icon={BookOpen} />
          <StatCard title="Hours Learned" value="48h" icon={Clock} trend="+12% this month" />
          <StatCard title="Tutors Connected" value="6" icon={Users} />
          <StatCard title="Learning Progress" value="72%" icon={TrendingUp} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming sessions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/classes">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcoming.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 rounded-xl border p-4"
                >
                  <Avatar>
                    <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
                    <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{session.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.tutorName} · {formatDate(session.date)} at {session.time}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href="/classroom/demo">Join</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { subject: "Mathematics", progress: 85 },
                { subject: "Physics", progress: 62 },
                { subject: "Python", progress: 45 },
              ].map((item) => (
                <div key={item.subject}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{item.subject}</span>
                    <span className="text-muted-foreground">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Recent tutors</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTutors.slice(0, 3).map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Notifications
              <Badge>3 new</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Session reminder: Calculus II tomorrow at 10 AM",
              "Michael Park shared new Python exercises",
              "Student Plus renews on May 27",
            ].map((n, i) => (
              <p key={i} className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                {n}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
