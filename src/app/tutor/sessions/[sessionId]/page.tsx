"use client";

import { useParams } from "next/navigation";
import { SessionRecap } from "@/components/sessions/session-recap";
import { routes } from "@/lib/routes";

export default function TutorClassRecapPage() {
  const params = useParams<{ sessionId: string }>();
  return (
    <SessionRecap
      sessionId={params.sessionId}
      backHref={routes.tutor.sessions}
      recordingsHref={routes.tutor.recordings}
      materialsHref={routes.tutor.materials}
    />
  );
}
