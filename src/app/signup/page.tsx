"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthRoleSelector, type AuthRole } from "@/components/auth/auth-role-selector";
import { routes } from "@/lib/routes";

export default function SignupChooserPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [role, setRole] = useState<AuthRole>("student");

  useEffect(() => {
    if (!session?.user?.email) return;
    const roleLabel = session.user.role?.toLowerCase();
    toast.message(
      `Signed in as ${session.user.email}${roleLabel ? ` (${roleLabel})` : ""}. Sign out to switch accounts.`,
      { id: "already-signed-in" }
    );
  }, [session?.user?.email, session?.user?.role]);

  const continueSignup = () => {
    if (role !== "student") {
      router.push(routes.signupTutor);
      return;
    }
    const callback = new URLSearchParams(window.location.search).get("callbackUrl");
    router.push(
      callback
        ? `${routes.signupStudent}?callbackUrl=${encodeURIComponent(callback)}`
        : routes.signupStudent
    );
  };

  return (
    <AuthLayout
      compact
      title="Create an account"
      subtitle=""
      headline="Simplify Learning And Live Tutoring"
      highlightWord="Live Tutoring"
    >
      <div className="space-y-4">
        <AuthRoleSelector value={role} onChange={setRole} />

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
