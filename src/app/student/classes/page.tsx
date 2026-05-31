"use client";

import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <p className="py-8 text-center text-muted-foreground">No sessions found.</p>
    );
  }
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
              <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold">{session.subject}</p>
              <p className="text-sm text-muted-foreground">
                {session.tutorName} · {formatDate(session.date)} · {session.time} ·{" "}
                {session.duration} min
              </p>
            </div>
            <Badge variant={statusVariant[session.status]}>{session.status}</Badge>
            <span className="font-medium">{formatCurrency(session.price)}</span>
            {session.status === "upcoming" && (
              <Button asChild>
                <Link href="/classroom/demo">Join session</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function StudentClassesPage() {
  const upcoming = studentSessions.filter((s) => s.status === "upcoming");
  const completed = studentSessions.filter((s) => s.status === "completed");

  return (
    <>
      <DashboardHeader title="My Classes" subtitle="Manage your learning sessions" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6">
            <SessionList sessions={upcoming} />
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            <SessionList sessions={completed} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
