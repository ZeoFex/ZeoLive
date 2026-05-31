import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { tutorSessions } from "@/lib/mock-data";

export default function TutorStudentsPage() {
  const students = tutorSessions.map((s) => ({
    name: s.tutorName,
    avatar: s.tutorAvatar,
    subject: s.subject,
  }));

  return (
    <>
      <DashboardHeader title="Students" subtitle="Students you're currently teaching" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-6">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={s.avatar} alt={s.name} />
                  <AvatarFallback>{s.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.subject}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
