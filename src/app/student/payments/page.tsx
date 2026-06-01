import Link from "next/link";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export default function StudentPaymentsPage() {
  return (
    <>
      <StudentPageHeader
        title="Billing & plans"
        description="Payment integration is coming soon. You can still book sessions at no charge during early access."
      />

      <div className="student-card max-w-lg p-6">
        <h3 className="font-bold text-slate-900">Payments not enabled yet</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          We are skipping payment processing for now. Your booked tutoring sessions are
          managed under Classes with no charges shown here.
        </p>
        <Button className="student-gradient-btn mt-6 rounded-xl" asChild>
          <Link href={routes.student.classes}>View your sessions</Link>
        </Button>
      </div>
    </>
  );
}
