"use client";

import { StudentPageHeader } from "@/components/layout/student-page-header";
import { RecordingsLibrary } from "@/components/recordings/recordings-library";

export default function StudentRecordingsPage() {
  return (
    <>
      <StudentPageHeader
        title="Recordings"
        description="Watch your lesson recordings later inside ZTL. Downloading to your device needs admin approval."
      />
      <RecordingsLibrary mode="student" />
    </>
  );
}
