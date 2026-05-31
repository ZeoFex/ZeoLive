import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { tutorSessions } from "@/lib/mock-data";

export default function TutorStudentsPage() {
  const students = tutorSessions.map((s) => ({
    name: s.tutorName,
    avatar: s.tutorAvatar,
    subject: s.subject,
  }));

  return (
    <>
      <TutorPageHeader
        title="Students"
        description="Students you're currently teaching."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((s, i) => (
          <div key={i} className="tutor-card flex items-center gap-4 p-5 sm:p-6">
            <Avatar className="h-14 w-14">
              <AvatarImage src={s.avatar} alt={s.name} />
              <AvatarFallback>{s.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900">{s.name}</p>
              <p className="text-sm text-slate-500">{s.subject}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
