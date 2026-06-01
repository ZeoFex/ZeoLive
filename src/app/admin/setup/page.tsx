"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";

export default function AdminSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/admin/bootstrap")
      .then((r) => r.json())
      .then((data) => {
        setNeedsBootstrap(!!data.needsBootstrap);
        if (!data.needsBootstrap) {
          router.replace("/admin/login");
        }
      })
      .finally(() => setChecking(false));
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create admin");
      toast.success("Admin account created. Sign in to continue.");
      router.push("/admin/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!needsBootstrap) return null;

  return (
    <AuthLayout
      title="Create super admin account"
      subtitle="Set up the first Zeolive super administrator. This account manages sub-admins and all platform users."
      headline="Manage Your Platform With Confidence"
      highlightWord="With Confidence"
    >
      <form onSubmit={onSubmit} className="auth-form space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="auth-field-label">
              First name
            </Label>
            <Input
              id="firstName"
              className="auth-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="auth-field-label">
              Last name
            </Label>
            <Input
              id="lastName"
              className="auth-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email" className="auth-field-label">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password" className="auth-field-label">
            Password
          </Label>
          <PasswordInput
            id="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="auth-primary-btn" disabled={loading}>
          {loading ? "Creating…" : "Create super admin account"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/admin/login" className="auth-link">
            Admin sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
