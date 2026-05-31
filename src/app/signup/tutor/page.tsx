import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { TutorRegistrationWizard } from "@/components/auth/tutor-registration-wizard";
import { routes } from "@/lib/routes";

export default function TutorSignupPage() {
  return (
    <AuthLayout
      title="Apply as a tutor"
      subtitle="Undergraduate, Diploma/HND, Graduate, or Postgraduate — verification steps depend on your level"
      headline="Share Your Knowledge And Teach Live"
      highlightWord="Teach Live"
      footer={
        <Link href={routes.adminSetup} className="auth-link">
          Administrators — register your organization here
        </Link>
      }
    >
      <div className="auth-form">
        <TutorRegistrationWizard />
      </div>
    </AuthLayout>
  );
}
