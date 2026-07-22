"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SignedInSignupNotice } from "@/components/auth/signed-in-signup-notice";
import { AuthLayout } from "@/components/auth/auth-layout";
import {
  ContactFields,
  NameFields,
  PasswordFields,
  TermsCheckbox,
} from "@/components/auth/registration-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL_TYPES, type SchoolTypeValue } from "@/lib/constants/registration";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  studentRegistrationSchema,
  type StudentRegistrationInput,
} from "@/lib/validations/registration";

export default function StudentSignupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [country, setCountry] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [schoolType, setSchoolType] = useState<SchoolTypeValue | "">("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentRegistrationInput>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: { acceptTerms: undefined },
  });

  const onSubmit = async (data: StudentRegistrationInput) => {
    const res = await fetch("/api/auth/register/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, country, acceptTerms: true }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof json.error === "string" ? json.error : "Could not create account");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.success("Account created. Please sign in with your email and password.");
      router.push("/login");
      return;
    }

    toast.success("Account created");
    router.push("/student/dashboard");
    router.refresh();
  };

  return (
    <AuthLayout
      compact
      title="Create student account"
      subtitle="A few details and you’re ready to book tutors and join live classes."
      headline="Learn Smarter With Live Sessions"
      highlightWord="Live Sessions"
    >
      <SignedInSignupNotice targetRole="student" />

      {session?.user?.role === "STUDENT" ? null : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form auth-form-compact space-y-3"
        >
          <NameFields register={register} errors={errors} compact />
          <ContactFields
            register={register}
            errors={errors}
            country={country}
            compact
            onCountryChange={(v) => {
              setCountry(v);
              setValue("country", v as StudentRegistrationInput["country"]);
            }}
          />
          <PasswordFields register={register} errors={errors} compact />

          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-700">School type *</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {SCHOOL_TYPES.map((type) => {
                const selected = schoolType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setSchoolType(type.value);
                      setValue("schoolType", type.value, { shouldValidate: true });
                    }}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                      selected
                        ? "border-[#0066CC] bg-sky-50 text-[#0066CC]"
                        : "border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {type.label.replace(" student", "")}
                  </button>
                );
              })}
            </div>
            {errors.schoolType && (
              <p className="text-xs text-destructive">{errors.schoolType.message}</p>
            )}

            {schoolType && schoolType !== "HOME_SCHOOL" && (
              <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
                <div>
                  <Label htmlFor="schoolName">School name *</Label>
                  <Input id="schoolName" {...register("schoolName")} />
                  {errors.schoolName && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors.schoolName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="schoolRegionState">School region / state *</Label>
                  <Input id="schoolRegionState" {...register("schoolRegionState")} />
                  {errors.schoolRegionState && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors.schoolRegionState.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <TermsCheckbox
            acceptTerms={acceptTerms}
            compact
            onAcceptTermsChange={(checked) => {
              setAcceptTerms(checked);
              setValue("acceptTerms", checked as true);
            }}
            error={errors.acceptTerms?.message}
          />

          <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
          <p className="text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href={routes.login} className="auth-link">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
