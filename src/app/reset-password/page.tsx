"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/shared/password-input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [tokenStatus, setTokenStatus] = useState<"loading" | "valid" | "invalid">(
    token ? "loading" : "invalid"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    let cancelled = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTokenStatus(data.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setTokenStatus("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(body.error ?? "Could not reset password");
      return;
    }

    toast.success(body.message ?? "Password updated");
    router.push(`${routes.login}?reset=success`);
  };

  if (tokenStatus === "loading") {
    return (
      <AuthLayout title="Reset password" subtitle="Checking your reset link…">
        <p className="text-center text-sm text-slate-500">Please wait.</p>
      </AuthLayout>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="Request a new reset link to continue"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-500">
            This password reset link is invalid or has expired.
          </p>
          <Link href={routes.forgotPassword} className="auth-primary-btn inline-flex items-center justify-center">
            Request new link
          </Link>
          <p className="text-sm text-slate-500">
            <Link href={routes.login} className="auth-link">
              Back to login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="You'll sign in on the next screen with your new password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="password" className="auth-field-label">
            New password
          </Label>
          <PasswordInput
            id="password"
            className={cn("auth-input", errors.password && "border-red-400")}
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="confirmPassword" className="auth-field-label">
            Confirm password
          </Label>
          <PasswordInput
            id="confirmPassword"
            className={cn("auth-input", errors.confirmPassword && "border-red-400")}
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Update password"}
        </button>
        <p className="text-center text-sm text-slate-500">
          <Link href={routes.login} className="auth-link">
            Back to login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Reset password" subtitle="Loading…">
          <p className="text-center text-sm text-slate-500">Please wait.</p>
        </AuthLayout>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
