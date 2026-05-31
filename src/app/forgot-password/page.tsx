"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(body.error ?? "Something went wrong. Try again.");
      return;
    }

    toast.success("If that email exists, reset instructions were sent.");
    router.push(routes.login);
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send reset instructions if an account exists"
      headline="Secure Access To Your Account"
      highlightWord="Secure Access"
    >
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
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
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
