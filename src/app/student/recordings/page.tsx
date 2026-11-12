"use client";

import { StudentPageHeader } from "@/components/layout/student-page-header";
import { RecordingsLibrary } from "@/components/recordings/recordings-library";

export default function StudentRecordingsPage() {
  return (
    <>
      <StudentPageHeader
        title="Recordings"
        description="Recordings from your live lessons appear here. Downloading a video to your device needs admin approval."
      />
      <RecordingsLibrary mode="student" />
    </>
  );
}
