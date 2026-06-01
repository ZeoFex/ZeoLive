"use client";

import { StudentPageHeader } from "@/components/layout/student-page-header";
import { MessagesInbox } from "@/components/messaging/messages-inbox";
import { routes } from "@/lib/routes";

export default function StudentMessagesPage() {
  return (
    <>
      <StudentPageHeader
        title="Messages"
        description="Chat with tutors you have sessions with. Messages are kept on record for your safety."
      />
      <MessagesInbox
        role="STUDENT"
        bookSessionHref={routes.student.book}
        emptyHint="Select a conversation or start one with a tutor from your sessions. Classroom chat during live lessons is saved here too."
      />
    </>
  );
}
