import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tutorSessions } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TutorSessionsPage() {
  return (
    <>
      <DashboardHeader title="Sessions" subtitle="Manage your teaching sessions" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your students</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {tutorSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-xl border px-4 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={s.tutorAvatar} alt={s.tutorName} />
                  <AvatarFallback>{s.tutorName[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{s.tutorName}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {tutorSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-6">
                <Avatar>
                  <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
                  <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{session.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.tutorName} · {formatDate(session.date)} · {session.time}
                  </p>
                </div>
                <Badge>{session.status}</Badge>
                <span>{formatCurrency(session.price)}</span>
                <Button asChild>
                  <Link href="/classroom/demo">Start session</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
