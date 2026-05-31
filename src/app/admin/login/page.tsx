import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">Loading…</div>
      }
    >
      <LoginForm portal="admin" />
    </Suspense>
  );
}
