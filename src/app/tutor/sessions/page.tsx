import Link from "next/link";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { tutorSessions } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function statusTag(status: string) {
  if (status === "upcoming") return "tutor-tag tutor-tag-violet";
  if (status === "completed") return "tutor-tag tutor-tag-emerald";
  return "tutor-tag tutor-tag-slate";
}

export default function TutorSessionsPage() {
  const uniqueStudents = Array.from(
    new Map(tutorSessions.map((s) => [s.tutorName, s])).values()
  );

  return (
    <>
      <TutorPageHeader
        title="Sessions"
        description="Manage your teaching sessions and join live classes."
      />

      <div className="tutor-card mb-6 p-5 sm:p-6">
        <h3 className="mb-4 text-base font-bold text-slate-900">Your students</h3>
        <div className="flex flex-wrap gap-3">
          {uniqueStudents.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={s.tutorAvatar} alt={s.tutorName} />
                <AvatarFallback>{s.tutorName[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-800">{s.tutorName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tutorSessions.map((session) => (
          <div key={session.id} className="tutor-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar>
                <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
                <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{session.subject}</p>
                <p className="text-sm text-slate-500">
                  {session.tutorName} · {formatDate(session.date)} · {session.time}
                </p>
              </div>
              <span className={cn(statusTag(session.status))}>{session.status}</span>
              <span className="text-sm font-semibold text-slate-800">
                {formatCurrency(session.price)}
              </span>
              <Button className="tutor-gradient-btn rounded-xl" asChild>
                <Link href="/classroom/demo">Start session</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
