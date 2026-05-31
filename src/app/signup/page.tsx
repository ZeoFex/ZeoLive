import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { TUTOR_EDUCATION_LEVELS } from "@/lib/constants/registration";

export default function SignupChooserPage() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Choose how you want to use ZoeLive"
    >
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <p className="font-medium">Student</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Book tutors, join live classes, and manage your schedule.
          </p>
          <Button className="mt-4 w-full" asChild>
            <Link href="/signup/student">Sign up as student</Link>
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <p className="font-medium">Tutor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Apply with your education credentials. We verify:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {TUTOR_EDUCATION_LEVELS.map((level) => (
              <li key={level.value}>• {level.label}</li>
            ))}
          </ul>
          <Button className="mt-4 w-full" variant="secondary" asChild>
            <Link href="/signup/tutor">Apply as tutor</Link>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
