"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function StudentMessagesPage() {
  return (
    <>
      <StudentPageHeader
        title="Messages"
        description="Chat with tutors you have sessions with."
      />

      <div className="student-card flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
          <MessageSquare className="h-7 w-7 text-violet-600" />
        </div>
        <div className="max-w-sm space-y-2">
          <h3 className="font-semibold text-slate-900">No conversations yet</h3>
          <p className="text-sm text-slate-500">
            In-app messaging will appear here once you book a session with a tutor. For
            now, use your session classroom chat during live lessons.
          </p>
        </div>
        <Button className="student-gradient-btn rounded-xl" asChild>
          <Link href={routes.student.book}>Find a tutor</Link>
        </Button>
      </div>
    </>
  );
}
