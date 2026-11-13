"use client";

import { useParams } from "next/navigation";
import { SessionRecap } from "@/components/sessions/session-recap";
import { routes } from "@/lib/routes";

export default function StudentClassRecapPage() {
  const params = useParams<{ sessionId: string }>();
  return (
    <SessionRecap
      sessionId={params.sessionId}
      backHref={routes.student.classes}
      recordingsHref={routes.student.recordings}
      materialsHref={routes.student.materials}
    />
  );
}
