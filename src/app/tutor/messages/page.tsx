"use client";

import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { MessagesInbox } from "@/components/messaging/messages-inbox";
import { routes } from "@/lib/routes";

export default function TutorMessagesPage() {
  return (
    <>
      <TutorPageHeader
        title="Messages"
        description="Chat with students you teach. All messages are stored for platform safety."
      />
      <MessagesInbox
        role="TUTOR"
        bookSessionHref={routes.tutor.sessions}
        emptyHint="Select a conversation or open a thread with a student from your sessions."
        className="tutor-card"
      />
    </>
  );
}
