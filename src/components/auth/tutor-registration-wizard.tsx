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
import { TeachingProgrammeFields } from "@/components/auth/teaching-programme-fields";
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

type WizardStep =
  | "account"
  | "documents"
  | "teaching"
  | "recommendation"
  | "complete"
  | "not-qualified";

const stepLabels: Record<WizardStep, string> = {
  account: "Account",
  documents: "Education & documents",
  teaching: "Programme & subjects",
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

  const [programmeId, setProgrammeId] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

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
    ? ["account", "documents", "teaching", "recommendation", "complete"]
    : ["account", "documents", "teaching", "complete"];

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

      setStep("teaching");
      toast.message("Select your programme and up to three subjects");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  };

  const submitTeaching = async () => {
    if (!programmeId) {
      toast.error("Select the programme you studied");
      return;
    }
    if (subjectIds.length === 0) {
      toast.error("Select at least one subject you can teach");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tutor/teaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programmeId, subjectIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not save teaching subjects");
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
    <div className="space-y-4">
      <SignedInSignupNotice targetRole="tutor" />

      {step !== "not-qualified" && step !== "complete" && (
        <div className="flex items-center gap-2">
          {visibleSteps.slice(0, -1).map((s, i) => (
            <div key={s} className="flex min-w-0 flex-1 flex-col gap-1">
              <div
                className={`h-1 rounded-full ${
                  i <= stepIndex ? "bg-primary" : "bg-muted"
                }`}
                title={stepLabels[s]}
              />
              <span
                className={`truncate text-[10px] font-medium ${
                  i <= stepIndex ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {stepLabels[s]}
              </span>
            </div>
          ))}
        </div>
      )}

      {step === "account" && (
        <form onSubmit={handleSubmit(createAccount)} className="space-y-3">
          <p className="text-xs text-slate-500">
            Step 1 of {visibleSteps.length - 1}: Create your account, then upload
            verification documents.
          </p>
          <NameFields register={register} errors={errors} compact />
          <ContactFields
            register={register}
            errors={errors}
            country={country}
            compact
            onCountryChange={(v) => {
              setCountry(v);
              setValue("country", v as TutorRegistrationInput["country"]);
            }}
          />
          <PasswordFields register={register} errors={errors} compact />
          <TermsCheckbox
            acceptTerms={acceptTerms}
            compact
            onAcceptTermsChange={(checked) => {
              setAcceptTerms(checked);
              setValue("acceptTerms", checked as true);
            }}
            error={errors.acceptTerms?.message}
          />
          <button type="submit" className="auth-primary-btn" disabled={loading}>
            {loading ? "Creating account…" : "Continue to verification"}
          </button>
        </form>
      )}

      {step === "documents" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Step 2: Choose your education level and upload the required documents.
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <EducationLevelFields
              educationLevel={educationLevel}
              onEducationLevelChange={setEducationLevel}
              compact
            />
            <div>
              <Label htmlFor="institution">Tertiary institution *</Label>
              <Input
                id="institution"
                placeholder="University or college name"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-verification-panel">
            <p>Documents</p>
            <p>
              Transcript, national ID, and live photo are required
              {needsCertificate ? "; certificate also required for your level" : ""}.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <DocumentUploadField
                label="Transcript"
                accept=".pdf,image/*"
                folder="tutor/transcripts"
                value={transcriptUrl}
                onUploaded={setTranscriptUrl}
                compact
              />
              {needsCertificate && (
                <DocumentUploadField
                  label="Certificate"
                  accept=".pdf,image/*"
                  folder="tutor/certificates"
                  value={certificateUrl}
                  onUploaded={setCertificateUrl}
                  compact
                />
              )}
              <DocumentUploadField
                label="National ID"
                accept=".pdf,image/*"
                folder="tutor/national-id"
                value={nationalIdUrl}
                onUploaded={setNationalIdUrl}
                compact
              />
              <div className={needsCertificate ? "sm:col-span-2" : undefined}>
                <LivePhotoCapture
                  value={livePhotoUrl}
                  onCaptured={setLivePhotoUrl}
                  compact
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1"
              onClick={() => setStep("account")}
            >
              Back
            </Button>
            <Button
              className="auth-primary-btn h-10 flex-1 border-0"
              onClick={submitDocuments}
              disabled={loading}
            >
              {loading ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {step === "teaching" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Step 3: Choose the tertiary programme you studied and up to three subjects
            you can teach.
          </p>

          <TeachingProgrammeFields
            programmeId={programmeId}
            subjectIds={subjectIds}
            onProgrammeChange={setProgrammeId}
            onSubjectIdsChange={setSubjectIds}
            compact
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1"
              onClick={() => setStep("documents")}
            >
              Back
            </Button>
            <Button
              className="auth-primary-btn h-10 flex-1 border-0"
              onClick={submitTeaching}
              disabled={loading}
            >
              {loading
                ? "Saving…"
                : needsRecommendation
                  ? "Continue"
                  : "Submit for review"}
            </Button>
          </div>
        </div>
      )}

      {step === "recommendation" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Step 4: Request a faculty recommendation — we email them a secure link.
          </p>

          <RecommenderRequestFields
            values={recommender}
            onChange={patchRecommender}
            compact
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
              className="h-10 flex-1"
              onClick={() => setStep("teaching")}
            >
              Back
            </Button>
            <Button
              className="auth-primary-btn h-10 flex-1 border-0"
              onClick={sendRecommendation}
              disabled={loading}
            >
              {loading ? "Sending…" : "Send request"}
            </Button>
          </div>
        </div>
      )}

      {step === "not-qualified" && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Based on your education level, you are not eligible to tutor on Zeolive at
            this time.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return home
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            Your application is submitted. We will email you when your profile is
            approved.
          </p>
          <Button onClick={() => router.push("/tutor/dashboard")}>
            Go to tutor dashboard
          </Button>
        </div>
      )}

      {step === "account" && (
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href={routes.login} className="auth-link">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
