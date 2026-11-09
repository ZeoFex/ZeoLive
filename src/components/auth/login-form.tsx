"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { signOutToAppPath } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthRoleSelector, type AuthRole } from "@/components/auth/auth-role-selector";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminDashboardPath } from "@/lib/admin-permissions";
import { resolveAuthRedirect } from "@/lib/auth-utils";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { AdminTier, Role } from "@/generated/prisma";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;
type LoginPortal = "default" | "admin";

export function LoginForm({ portal = "default" }: { portal?: LoginPortal }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const reset = searchParams.get("reset");
  const { data: session } = useSession();
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [role, setRole] = useState<AuthRole>("student");
  const isAdminPortal = portal === "admin";

  useEffect(() => {
    fetch("/api/admin/bootstrap")
      .then((r) => r.json())
      .then((data) => setNeedsAdminSetup(!!data.needsBootstrap))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reset === "success") {
      toast.success("Password updated. Sign in with your new password.");
    }
  }, [reset]);

  // If an admin session already exists on the admin login page, leave immediately.
  useEffect(() => {
    if (!session?.user?.role) return;

    if (isAdminPortal && session.user.role === "ADMIN") {
      const dest = adminDashboardPath(session.user.adminTier);
      if (window.location.pathname !== dest) {
        window.location.replace(dest);
      }
      return;
    }

    if (!isAdminPortal && session.user.role !== "ADMIN") {
      // Keep student/tutor login usable while signed in; no forced redirect here.
    }
  }, [isAdminPortal, session]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const readSessionRole = async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const sessionData = await sessionRes.json().catch(() => null);
      const userRole = sessionData?.user?.role as Role | undefined;
      const adminTier = sessionData?.user?.adminTier as AdminTier | undefined;
      if (userRole) {
        return { userRole, adminTier };
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
    return null;
  };

  const onSubmit = async (data: FormData) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    const sessionInfo = await readSessionRole();
    if (!sessionInfo?.userRole) {
      toast.error("Signed in, but session was not ready. Please try again.");
      return;
    }

    const { userRole, adminTier } = sessionInfo;

    if (isAdminPortal && userRole !== "ADMIN") {
      await signOut({ redirect: false });
      toast.error(
        "This account is not an administrator. Use student or tutor login instead."
      );
      return;
    }

    if (isAdminPortal && userRole === "ADMIN" && adminTier === "SUBADMIN") {
      toast.message("Sub-admins can only review tutor applications.");
    }

    toast.success("Signed in");

    const dest = await resolveAuthRedirect(userRole, callbackUrl, adminTier);
    // Full navigation ensures the auth cookie is applied before protected routes run.
    window.location.assign(dest);
  };

  return (
    <AuthLayout
      title={isAdminPortal ? "Admin sign in" : "Welcome back"}
      subtitle={
        isAdminPortal
          ? "Super admins manage the platform. Sub-admins sign in here for tutor review only."
          : ""
      }
      headline="Connect With Expert Tutors Anytime"
      highlightWord="Expert Tutors"
      footer={
        isAdminPortal ? (
          <Link href={routes.login} className="auth-link">
            Student or tutor login
          </Link>
        ) : undefined
      }
    >
      {session?.user && (
        <div className="auth-card mb-6 text-sm">
          <p className="font-medium text-slate-800">
            Signed in as {session.user.email}
            {session.user.role ? ` (${session.user.role.toLowerCase()})` : ""}
          </p>
          <p className="mt-1 text-slate-500">
            Sign out to switch accounts (e.g. student → admin).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              void signOutToAppPath(
                isAdminPortal ? routes.adminLogin : routes.login
              )
            }
          >
            Sign out
          </Button>
        </div>
      )}

      {!isAdminPortal && (
        <div className="mb-6">
          <AuthRoleSelector value={role} onChange={setRole} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="email" className="auth-field-label">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@email.com"
            className={cn("auth-input", errors.email && "border-red-400")}
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="auth-field-label">
              Password
            </Label>
            <Link href={routes.forgotPassword} className="auth-link text-sm">
              Forgot?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            className={cn("auth-input", errors.password && "border-red-400")}
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-slate-500">
        {!isAdminPortal && (
          <>
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href={role === "student" ? routes.signupStudent : routes.signupTutor}
                className="auth-link"
              >
                Create account
              </Link>
            </p>
            <p>
              <Link href={routes.signup} className="auth-link">
                View all signup options
              </Link>
            </p>
          </>
        )}
        {needsAdminSetup && isAdminPortal && (
          <p>
            First time setup?{" "}
            <Link href={routes.adminSetup} className="auth-link">
              Create admin account
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
