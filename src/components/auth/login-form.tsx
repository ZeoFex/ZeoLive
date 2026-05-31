"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { resolveAuthRedirect } from "@/lib/auth-utils";
import { routes } from "@/lib/routes";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AdminTier, Role } from "@/generated/prisma";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

type AccountHint = "student" | "tutor";
type LoginPortal = "default" | "admin";

export function LoginForm({ portal = "default" }: { portal?: LoginPortal }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const reset = searchParams.get("reset");
  const { data: session } = useSession();
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);
  const [hint, setHint] = useState<AccountHint>("student");
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    const role = sessionData?.user?.role as Role | undefined;
    const adminTier = sessionData?.user?.adminTier as AdminTier | undefined;

    if (!role) {
      toast.error("Could not read your account role");
      return;
    }

    if (isAdminPortal && role !== "ADMIN") {
      await signOut({ redirect: false });
      toast.error(
        "This account is not an administrator. Use student or tutor login instead."
      );
      return;
    }

    if (isAdminPortal && role === "ADMIN" && adminTier === "SUBADMIN") {
      toast.message("Sub-admins can only review tutor applications.");
    }

    toast.success("Signed in");

    const dest = await resolveAuthRedirect(role, callbackUrl, adminTier);
    router.push(dest);
    router.refresh();
  };

  return (
    <AuthLayout
      title={isAdminPortal ? "Admin sign in" : "Sign in"}
      subtitle={
        isAdminPortal
          ? "Super admins manage the platform. Sub-admins sign in here for tutor review only."
          : "Students and tutors sign in with the email on their account"
      }
    >
      {session?.user && (
        <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm">
          <p className="font-medium">
            Signed in as {session.user.email}
            {session.user.role ? ` (${session.user.role.toLowerCase()})` : ""}
          </p>
          <p className="mt-1 text-muted-foreground">
            Sign out to switch accounts (e.g. student → admin).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              signOut({
                callbackUrl: isAdminPortal ? routes.adminLogin : routes.login,
              })
            }
          >
            Sign out
          </Button>
        </div>
      )}

      {!isAdminPortal && (
        <div className="mb-6 flex rounded-lg border p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              hint === "student"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
            onClick={() => setHint("student")}
          >
            Student
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              hint === "tutor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
            onClick={() => setHint("tutor")}
          >
            Tutor
          </button>
        </div>
      )}

      {!isAdminPortal && hint === "tutor" && (
        <p className="mb-4 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          Tutors must complete verification and receive admin approval before teaching.
          Unapproved tutors will see a waiting screen after sign-in.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@email.com"
            className="mt-1.5"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href={routes.forgotPassword}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            className="mt-1.5"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 space-y-3 border-t pt-6">
        {isAdminPortal ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link href={routes.login} className="text-primary hover:underline">
              Student or tutor login
            </Link>
          </p>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground">
              {hint === "student" ? (
                <>
                  New student?{" "}
                  <Link
                    href={routes.signupStudent}
                    className="text-primary hover:underline"
                  >
                    Create student account
                  </Link>
                </>
              ) : (
                <>
                  New tutor?{" "}
                  <Link
                    href={routes.signupTutor}
                    className="text-primary hover:underline"
                  >
                    Apply as tutor
                  </Link>
                </>
              )}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link href={routes.signup} className="text-primary hover:underline">
                View all signup options
              </Link>
              {" · "}
              <Link href={routes.adminLogin} className="text-primary hover:underline">
                Admin login
              </Link>
            </p>
          </>
        )}
        {needsAdminSetup && (
          <p className="text-center text-sm text-muted-foreground">
            First time setup?{" "}
            <Link href={routes.adminSetup} className="text-primary hover:underline">
              Create admin account
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
