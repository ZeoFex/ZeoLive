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
      title="Create an account"
      subtitle="Choose your category to access tailored features and resources"
      headline="Simplify Learning And Live Tutoring"
      highlightWord="Live Tutoring"
      footer={
        <Link href={routes.adminSetup} className="auth-link">
          Administrators — register your organization here
        </Link>
      }
    >
      <div className="space-y-6">
        <AuthRoleSelector value={role} onChange={setRole} />

        {role === "student" ? (
          <p className="text-sm text-slate-500">
            Book verified tutors, join live classes, and manage your learning schedule.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Apply with your education credentials. Admin verification is required before
            you can teach on the platform.
          </p>
        )}

        <button type="button" className="auth-primary-btn" onClick={continueSignup}>
          Continue
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href={routes.login} className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
