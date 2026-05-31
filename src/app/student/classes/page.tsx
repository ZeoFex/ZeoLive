"use client";

import Link from "next/link";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { studentSessions } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant = {
  upcoming: "default" as const,
  live: "success" as const,
  completed: "secondary" as const,
  cancelled: "destructive" as const,
};

function SessionList({ sessions }: { sessions: typeof studentSessions }) {
  if (sessions.length === 0) {
    return (
      <div className="student-empty py-10 text-center text-sm text-slate-500">
        No sessions found.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="student-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
              <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{session.subject}</p>
              <p className="mt-1 text-sm text-slate-500">
                {session.tutorName} · {formatDate(session.date)} · {session.time} ·{" "}
                {session.duration} min
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[session.status]}>{session.status}</Badge>
                <span className="text-sm font-semibold text-slate-800">
                  {formatCurrency(session.price)}
                </span>
              </div>
            </div>
            {session.status === "upcoming" && (
              <Button className="student-gradient-btn w-full shrink-0 rounded-xl sm:w-auto" asChild>
                <Link href="/classroom/demo">Join session</Link>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentClassesPage() {
  const upcoming = studentSessions.filter((s) => s.status === "upcoming");
  const completed = studentSessions.filter((s) => s.status === "completed");

  return (
    <>
      <StudentPageHeader
        title="Your sessions"
        description="Manage upcoming and completed learning sessions."
      />

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="student-tabs-list mb-4 h-auto w-full justify-start sm:w-auto">
          <TabsTrigger value="upcoming" className="student-tab-trigger rounded-lg px-4">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="student-tab-trigger rounded-lg px-4">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <SessionList sessions={upcoming} />
        </TabsContent>
        <TabsContent value="completed">
          <SessionList sessions={completed} />
        </TabsContent>
      </Tabs>
    </>
  );
}
