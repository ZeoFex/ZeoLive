"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Email verified!");
    router.push("/login");
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your inbox"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <Input
              key={i}
              className="h-12 w-12 text-center text-lg"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <button type="button" className="text-primary hover:underline">
            Resend
          </button>
        </p>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
