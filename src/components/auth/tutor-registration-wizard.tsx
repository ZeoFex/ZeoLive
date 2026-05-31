"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DocumentUploadField } from "@/components/auth/document-upload-field";
import { EducationLevelFields } from "@/components/auth/education-level-fields";
import { LivePhotoCapture } from "@/components/auth/live-photo-capture";
import {
  ContactFields,
  NameFields,
  PasswordFields,
  TermsCheckbox,
} from "@/components/auth/registration-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RecommenderRequestFields,
  type RecommenderFormValues,
} from "@/components/auth/recommender-request-fields";
import {
  tutorRequiresCertificate,
  tutorRequiresRecommendation,
  type TutorEducationLevelValue,
} from "@/lib/constants/registration";
import { buildRecommendationEmailPreview } from "@/lib/recommendation-preview";
import { SignedInSignupNotice } from "@/components/auth/signed-in-signup-notice";
import {
  tutorRegistrationSchema,
  type TutorRegistrationInput,
} from "@/lib/validations/registration";
import { routes } from "@/lib/routes";

type WizardStep = "account" | "documents" | "recommendation" | "complete" | "not-qualified";

const stepLabels: Record<WizardStep, string> = {
  account: "Account",
  documents: "Education & documents",
  recommendation: "Recommendation",
  complete: "Done",
  "not-qualified": "Not eligible",
};

export function TutorRegistrationWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<WizardStep>("account");
  const [country, setCountry] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tutorFullName, setTutorFullName] = useState("");

  const [educationLevel, setEducationLevel] = useState<TutorEducationLevelValue | "">("");
  const [institutionName, setInstitutionName] = useState("");
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [nationalIdUrl, setNationalIdUrl] = useState("");
  const [livePhotoUrl, setLivePhotoUrl] = useState("");

  const [recommender, setRecommender] = useState<RecommenderFormValues>({
    title: "DR",
    recommenderFirstName: "",
    recommenderLastName: "",
    recommenderSchoolName: "",
    departmentName: "",
    recommenderEmail: "",
    recommenderPhone: "",
    message: "",
  });

  const patchRecommender = <K extends keyof RecommenderFormValues>(
    key: K,
    value: RecommenderFormValues[K]
  ) => {
    setRecommender((prev) => ({ ...prev, [key]: value }));
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TutorRegistrationInput>({
    resolver: zodResolver(tutorRegistrationSchema),
  });

  const needsCertificate =
    educationLevel && tutorRequiresCertificate(educationLevel);
  const needsRecommendation =
    educationLevel && tutorRequiresRecommendation(educationLevel);

  const visibleSteps: WizardStep[] = needsRecommendation
    ? ["account", "documents", "recommendation", "complete"]
    : ["account", "documents", "complete"];

  const stepIndex = visibleSteps.indexOf(step === "not-qualified" ? "documents" : step);

  const createAccount = async (data: TutorRegistrationInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, country, acceptTerms: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string" ? json.error : "Could not create account"
        );
      }

      setTutorFullName(
        [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ")
      );

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.success("Account created. Sign in to continue verification.");
        router.push("/login");
        return;
      }

      toast.success("Account created. Continue with your education details.");
      setStep("documents");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const submitDocuments = async () => {
    if (!educationLevel || !institutionName.trim()) {
      toast.error("Select education level and enter your institution");
      return;
    }
    if (!transcriptUrl || !nationalIdUrl || !livePhotoUrl) {
      toast.error("Upload transcript, national ID, and live photo");
      return;
    }
    if (needsCertificate && !certificateUrl) {
      toast.error("Certificate is required for Diploma/HND, Graduate, and Postgraduate");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tutor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          educationLevel,
          institutionName,
          transcriptUrl,
          certificateUrl: certificateUrl || undefined,
          nationalIdUrl,
          livePhotoUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not save verification");
      }

      if (json.notQualified) {
        setStep("not-qualified");
        return;
      }

      if (json.needsRecommendation) {
        setStep("recommendation");
        toast.message("Request a recommendation from your institution");
        return;
      }

      setStep("complete");
      toast.success("Verification submitted for review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  };

  const sendRecommendation = async () => {
    if (
      !recommender.recommenderFirstName ||
      !recommender.recommenderLastName ||
      !recommender.recommenderSchoolName ||
      !recommender.departmentName ||
      !recommender.recommenderEmail
    ) {
      toast.error("Fill in all required recommender fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tutor/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recommender.title,
          recommenderFirstName: recommender.recommenderFirstName,
          recommenderLastName: recommender.recommenderLastName,
          recommenderSchoolName: recommender.recommenderSchoolName,
          departmentName: recommender.departmentName,
          recommenderEmail: recommender.recommenderEmail,
          recommenderPhone: recommender.recommenderPhone || undefined,
          message: recommender.message || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not send recommendation request");
      }

      if (json.devMode) {
        toast.success(
          "Recommendation saved. Check the server console for the link (SMTP not configured)."
        );
      } else {
        toast.success("Recommendation request emailed to your recommender");
      }
      setStep("complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role === "TUTOR") {
    return <SignedInSignupNotice targetRole="tutor" />;
  }

  return (
    <div className="space-y-6">
      <SignedInSignupNotice targetRole="tutor" />

      {step !== "not-qualified" && step !== "complete" && (
        <div className="flex gap-2">
          {visibleSteps.slice(0, -1).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
              title={stepLabels[s]}
            />
          ))}
        </div>
      )}

      {step === "account" && (
        <form onSubmit={handleSubmit(createAccount)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Step 1 of {visibleSteps.length - 1}: Create your account. Next you will
            choose your education level (Undergraduate, Diploma/HND, Graduate, or
            Postgraduate) and upload documents.
          </p>
          <NameFields register={register} errors={errors} />
          <ContactFields
            register={register}
            errors={errors}
            country={country}
            onCountryChange={(v) => {
              setCountry(v);
              setValue("country", v as TutorRegistrationInput["country"]);
            }}
          />
          <PasswordFields register={register} errors={errors} />
          <TermsCheckbox
            acceptTerms={acceptTerms}
            onAcceptTermsChange={(checked) => {
              setAcceptTerms(checked);
              setValue("acceptTerms", checked as true);
            }}
            error={errors.acceptTerms?.message}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Continue to verification"}
          </Button>
        </form>
      )}

      {step === "documents" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Step 2: Select your education level. Requirements differ for continuing
            undergraduates, Diploma/HND, graduates, and postgraduates.
          </p>

          <EducationLevelFields
            educationLevel={educationLevel}
            onEducationLevelChange={setEducationLevel}
          />

          <div>
            <Label htmlFor="institution">Tertiary institution *</Label>
            <Input
              id="institution"
              className="mt-1.5"
              placeholder="University or college name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Upload documents</p>
            <DocumentUploadField
              label="Transcript"
              accept=".pdf,image/*"
              folder="tutor/transcripts"
              value={transcriptUrl}
              onUploaded={setTranscriptUrl}
            />
            {needsCertificate && (
              <DocumentUploadField
                label="Certificate (Diploma / Degree / Postgraduate)"
                accept=".pdf,image/*"
                folder="tutor/certificates"
                value={certificateUrl}
                onUploaded={setCertificateUrl}
              />
            )}
            <DocumentUploadField
              label="National ID"
              accept=".pdf,image/*"
              folder="tutor/national-id"
              value={nationalIdUrl}
              onUploaded={setNationalIdUrl}
            />
            <LivePhotoCapture value={livePhotoUrl} onCaptured={setLivePhotoUrl} />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep("account")}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={submitDocuments} disabled={loading}>
              {loading ? "Saving…" : needsRecommendation ? "Continue" : "Submit"}
            </Button>
          </div>
        </div>
      )}

      {step === "recommendation" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Step 3: As a continuing undergraduate, a faculty member must submit a
            letter of recommendation. We email them a secure link.
          </p>

          <RecommenderRequestFields
            values={recommender}
            onChange={patchRecommender}
            emailPreview={buildRecommendationEmailPreview({
              recommender,
              tutorFullName:
                tutorFullName ||
                [getValues("firstName"), getValues("lastName")].filter(Boolean).join(" ") ||
                "[You]",
              tutorInstitutionName: institutionName || "[Your institution]",
            })}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep("documents")}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={sendRecommendation} disabled={loading}>
              {loading ? "Sending…" : "Send request"}
            </Button>
          </div>
        </div>
      )}

      {step === "not-qualified" && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Based on your education level, you are not eligible to tutor on ZoeLive at
            this time.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return home
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Your application is submitted. Sign in anytime to check status. We will
            email you when your profile is approved.
          </p>
          <Button onClick={() => router.push("/tutor/dashboard")}>
            Go to tutor dashboard
          </Button>
        </div>
      )}

      {step === "account" && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
