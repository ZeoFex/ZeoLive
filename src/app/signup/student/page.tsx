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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCHOOL_TYPES, type SchoolTypeValue } from "@/lib/constants/registration";
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
      variant="student"
      title="Create student account"
      subtitle="After registration, sign in with your email and password to book tutors."
    >
      <SignedInSignupNotice targetRole="student" />

      {session?.user?.role === "STUDENT" ? null : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <NameFields register={register} errors={errors} />
        <ContactFields
          register={register}
          errors={errors}
          country={country}
          onCountryChange={(v) => {
            setCountry(v);
            setValue("country", v as StudentRegistrationInput["country"]);
          }}
        />
        <PasswordFields register={register} errors={errors} />

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">School information</p>
          <div className="space-y-2">
            {SCHOOL_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="schoolType"
                  value={type.value}
                  checked={schoolType === type.value}
                  onChange={() => {
                    setSchoolType(type.value);
                    setValue("schoolType", type.value);
                  }}
                />
                {type.label}
              </label>
            ))}
          </div>
          {errors.schoolType && (
            <p className="text-sm text-destructive">{errors.schoolType.message}</p>
          )}

          {schoolType && schoolType !== "HOME_SCHOOL" && (
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="schoolName">School name *</Label>
                <Input id="schoolName" className="mt-1.5" {...register("schoolName")} />
                {errors.schoolName && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.schoolName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="schoolRegionState">Region / State of school *</Label>
                <Input
                  id="schoolRegionState"
                  className="mt-1.5"
                  {...register("schoolRegionState")}
                />
                {errors.schoolRegionState && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.schoolRegionState.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <TermsCheckbox
          acceptTerms={acceptTerms}
          onAcceptTermsChange={(checked) => {
            setAcceptTerms(checked);
            setValue("acceptTerms", checked as true);
          }}
          error={errors.acceptTerms?.message}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
      )}
    </AuthLayout>
  );
}
