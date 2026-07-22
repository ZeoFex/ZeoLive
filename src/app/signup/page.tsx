"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthRoleSelector, type AuthRole } from "@/components/auth/auth-role-selector";
import { routes } from "@/lib/routes";

export default function SignupChooserPage() {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>("student");

  const continueSignup = () => {
    router.push(role === "student" ? routes.signupStudent : routes.signupTutor);
  };

  return (
    <AuthLayout
      compact
      title="Create an account"
      subtitle="Choose student or tutor — registration only takes a minute."
      headline="Simplify Learning And Live Tutoring"
      highlightWord="Live Tutoring"
    >
      <div className="space-y-4">
        <AuthRoleSelector
          value={role}
          onChange={setRole}
          label="Who are you signing up as?"
        />

        {role === "student" ? (
          <p className="text-xs leading-snug text-slate-500">
            Book verified tutors, join live classes, and manage your learning schedule.
          </p>
        ) : (
          <p className="text-xs leading-snug text-slate-500">
            Apply with your education credentials. Admin verification is required before
            you can teach.
          </p>
        )}

        <button type="button" className="auth-primary-btn" onClick={continueSignup}>
          Continue
        </button>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href={routes.login} className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
