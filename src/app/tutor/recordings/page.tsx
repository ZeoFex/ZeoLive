"use client";

import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { RecordingsLibrary } from "@/components/recordings/recordings-library";

export default function TutorRecordingsPage() {
  return (
    <>
      <TutorPageHeader
        title="Recordings"
        description="Lesson recordings from your live sessions appear here. You can also upload a finished class and request an admin-approved download."
      />
      <RecordingsLibrary mode="tutor" allowUpload />
    </>
  );
}
