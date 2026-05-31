import { AuthLayout } from "@/components/auth/auth-layout";
import { TutorRegistrationWizard } from "@/components/auth/tutor-registration-wizard";

export default function TutorSignupPage() {
  return (
    <AuthLayout
      variant="tutor"
      title="Apply as a tutor"
      subtitle="Undergraduate, Diploma/HND, Graduate, or Postgraduate — verification steps depend on your level."
    >
      <TutorRegistrationWizard />
    </AuthLayout>
  );
}
