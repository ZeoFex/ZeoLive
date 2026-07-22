import { AuthLayout } from "@/components/auth/auth-layout";
import { TutorRegistrationWizard } from "@/components/auth/tutor-registration-wizard";

export default function TutorSignupPage() {
  return (
    <AuthLayout
      compact
      title="Apply as a tutor"
      subtitle="Create your account, then complete education verification in a few short steps."
      headline="Share Your Knowledge And Teach Live"
      highlightWord="Teach Live"
    >
      <div className="auth-form auth-form-compact">
        <TutorRegistrationWizard />
      </div>
    </AuthLayout>
  );
}
