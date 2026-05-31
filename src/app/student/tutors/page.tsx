import { DashboardHeader } from "@/components/layout/dashboard-header";
import { TutorCard } from "@/components/shared/tutor-card";
import { allTutors } from "@/lib/mock-data";

export default function StudentTutorsPage() {
  return (
    <>
      <DashboardHeader title="Tutors" subtitle="Browse all available tutors" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      </div>
    </>
  );
}
