"use client";

import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { RecordingsLibrary } from "@/components/recordings/recordings-library";

export default function TutorRecordingsPage() {
  return (
    <>
      <TutorPageHeader
        title="Recordings"
        description="Watch all lesson recordings in ZTL, upload your completed sessions, and request admin-approved downloads."
      />
      <RecordingsLibrary mode="tutor" allowUpload />
    </>
  );
}
