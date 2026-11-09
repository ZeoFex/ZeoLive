"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { WizardStepper } from "@/components/auth/wizard-stepper";
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
  clearTutorSignupDraft,
  emptyTutorSignupDraft,
  maxStep,
  readTutorSignupDraft,
  resolveResumeStep,
  stepRank,
  writeTutorSignupDraft,
  type TutorWizardStep,
} from "@/lib/tutor-signup-draft";
import {
  tutorRegistrationSchema,
  type TutorRegistrationInput,
} from "@/lib/validations/registration";
import { routes } from "@/lib/routes";

const stepLabels: Record<TutorWizardStep, string> = {
  account: "Account",
  documents: "Education & documents",
  teaching: "Programme & subjects",
  recommendation: "Recommendation",
  complete: "Done",
  "not-qualified": "Not eligible",
};

export function TutorRegistrationWizard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [step, setStep] = useState<TutorWizardStep>("account");
  const [unlockedStep, setUnlockedStep] = useState<TutorWizardStep>("account");
  const [accountCreated, setAccountCreated] = useState(false);
  const [country, setCountry] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
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

  const hydratedRef = useRef(false);

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
    reset,
    watch,
    formState: { errors },
  } = useForm<TutorRegistrationInput>({
    resolver: zodResolver(tutorRegistrationSchema),
  });

  const watchedAccount = watch();

  const needsCertificate =
    educationLevel && tutorRequiresCertificate(educationLevel);
  const needsRecommendation =
    educationLevel && tutorRequiresRecommendation(educationLevel);

  const progressSteps = useMemo(() => {
    const ids: TutorWizardStep[] = needsRecommendation
      ? ["account", "documents", "teaching", "recommendation"]
      : ["account", "documents", "teaching"];
    return ids.map((id) => ({ id, label: stepLabels[id] }));
  }, [needsRecommendation]);

  const goToStep = useCallback(
    (next: TutorWizardStep) => {
      if (next === "not-qualified" || next === "complete") {
        setStep(next);
        return;
      }

      // Account is finished once created — don't reopen signup form.
      if (
        next === "account" &&
        (accountCreated || session?.user?.role === "TUTOR")
      ) {
        toast.message("Your account is already created. Continue verification.");
        return;
      }

      // Account must be created before any later step.
      if (next !== "account" && !accountCreated && session?.user?.role !== "TUTOR") {
        toast.error("Create your account first to continue.");
        setStep("account");
        return;
      }

      if (stepRank(next) > stepRank(unlockedStep)) {
        toast.error("Complete the current step before moving ahead.");
        return;
      }

      setStep(next);
    },
    [accountCreated, session?.user?.role, unlockedStep]
  );

  const unlockAndGo = useCallback((next: TutorWizardStep) => {
    setUnlockedStep((prev) => maxStep(prev, next));
    setStep(next);
  }, []);

  const applyDraft = useCallback(
    (draft: ReturnType<typeof emptyTutorSignupDraft>) => {
      const created = Boolean(draft.accountCreated);
      setAccountCreated(created);
      setUnlockedStep(draft.unlockedStep || draft.step || "account");
      setStep(draft.step);
      setCountry(draft.country);
      setAcceptTerms(draft.acceptTerms);
      setEducationLevel(draft.educationLevel);
      setInstitutionName(draft.institutionName);
      setTranscriptUrl(draft.transcriptUrl);
      setCertificateUrl(draft.certificateUrl);
      setNationalIdUrl(draft.nationalIdUrl);
      setLivePhotoUrl(draft.livePhotoUrl);
      setProgrammeId(draft.programmeId);
      setSubjectIds(draft.subjectIds);
      setRecommender(draft.recommender);
      setTutorFullName(draft.tutorFullName);
      reset({
        firstName: draft.account.firstName ?? "",
        middleName: draft.account.middleName ?? "",
        lastName: draft.account.lastName ?? "",
        email: draft.account.email ?? "",
        phone: draft.account.phone ?? "",
        dateOfBirth: draft.account.dateOfBirth ?? "",
        regionState: draft.account.regionState ?? "",
        password: "",
        confirmPassword: "",
        country: (draft.country || undefined) as TutorRegistrationInput["country"],
        acceptTerms: draft.acceptTerms ? true : undefined,
      });
      if (draft.country) {
        setValue("country", draft.country as TutorRegistrationInput["country"]);
      }
      if (draft.acceptTerms) {
        setValue("acceptTerms", true);
      }
    },
    [reset, setValue]
  );

  useEffect(() => {
    if (hydratedRef.current || sessionStatus === "loading") return;
    hydratedRef.current = true;

    const restore = async () => {
      const localDraft = readTutorSignupDraft();

      if (session?.user?.role === "TUTOR") {
        try {
          const res = await fetch("/api/tutor/onboarding/status");
          if (res.ok) {
            const status = await res.json();
            if (status.onboardingComplete || status.verificationStatus === "APPROVED") {
              setRestoring(false);
              return;
            }

            const resumeStep = resolveResumeStep(status) ?? "documents";
            const safeStep =
              resumeStep === "complete" ? "complete" : resumeStep;
            const merged = emptyTutorSignupDraft({
              ...(localDraft ?? {}),
              accountCreated: true,
              step: safeStep,
              unlockedStep: maxStep(
                localDraft?.unlockedStep ?? "documents",
                safeStep === "complete" ? "recommendation" : safeStep
              ),
              educationLevel:
                (status.educationLevel as TutorEducationLevelValue) ||
                localDraft?.educationLevel ||
                "",
              institutionName:
                status.institutionName || localDraft?.institutionName || "",
              transcriptUrl: status.transcriptUrl || localDraft?.transcriptUrl || "",
              certificateUrl:
                status.certificateUrl || localDraft?.certificateUrl || "",
              nationalIdUrl: status.nationalIdUrl || localDraft?.nationalIdUrl || "",
              livePhotoUrl: status.livePhotoUrl || localDraft?.livePhotoUrl || "",
              programmeId: status.programmeId || localDraft?.programmeId || "",
              subjectIds:
                (status.subjectIds as string[] | undefined)?.length
                  ? status.subjectIds
                  : localDraft?.subjectIds || [],
              tutorFullName: status.tutorFullName || localDraft?.tutorFullName || "",
            });

            if (resumeStep === "complete") {
              clearTutorSignupDraft();
              setAccountCreated(true);
              setStep("complete");
                setRestoring(false);
              return;
            }

            applyDraft(merged);
            writeTutorSignupDraft(merged);
            toast.message("Welcome back — continuing where you left off.");
            setRestoring(false);
            return;
          }
        } catch {
          // Fall through to local draft.
        }
      }

      if (localDraft) {
        // Never skip account unless it was actually created (or user is signed in).
        const canResumePastAccount =
          localDraft.accountCreated === true || session?.user?.role === "TUTOR";

        if (!canResumePastAccount && localDraft.step !== "account") {
          const locked = emptyTutorSignupDraft({
            ...localDraft,
            step: "account",
            unlockedStep: "account",
            accountCreated: false,
          });
          applyDraft(locked);
          writeTutorSignupDraft(locked);
        } else {
          applyDraft({
            ...localDraft,
            unlockedStep: maxStep(
              localDraft.unlockedStep ?? "account",
              localDraft.step
            ),
          });
          if (localDraft.step !== "account") {
            toast.message("Draft restored. You can continue your application.");
          }
        }
      }

      setRestoring(false);
    };

    void restore();
  }, [applyDraft, session?.user?.role, sessionStatus]);

  useEffect(() => {
    if (restoring) return;
    if (step === "complete" || step === "not-qualified") return;

    const draft = emptyTutorSignupDraft({
      step,
      unlockedStep: maxStep(unlockedStep, step),
      accountCreated,
      country,
      acceptTerms,
      account: {
        firstName: watchedAccount.firstName || "",
        middleName: watchedAccount.middleName || "",
        lastName: watchedAccount.lastName || "",
        email: watchedAccount.email || "",
        phone: watchedAccount.phone || "",
        dateOfBirth: watchedAccount.dateOfBirth || "",
        regionState: watchedAccount.regionState || "",
      },
      educationLevel,
      institutionName,
      transcriptUrl,
      certificateUrl,
      nationalIdUrl,
      livePhotoUrl,
      programmeId,
      subjectIds,
      recommender,
      tutorFullName,
    });
    writeTutorSignupDraft(draft);
  }, [
    restoring,
    step,
    unlockedStep,
    accountCreated,
    country,
    acceptTerms,
    watchedAccount.firstName,
    watchedAccount.middleName,
    watchedAccount.lastName,
    watchedAccount.email,
    watchedAccount.phone,
    watchedAccount.dateOfBirth,
    watchedAccount.regionState,
    educationLevel,
    institutionName,
    transcriptUrl,
    certificateUrl,
    nationalIdUrl,
    livePhotoUrl,
    programmeId,
    subjectIds,
    recommender,
    tutorFullName,
  ]);

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

      const fullName = [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ");
      setTutorFullName(fullName);

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      setAccountCreated(true);
      writeTutorSignupDraft(
        emptyTutorSignupDraft({
          step: "documents",
          unlockedStep: "documents",
          accountCreated: true,
          country,
          acceptTerms: true,
          account: {
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            regionState: data.regionState,
          },
          educationLevel,
          institutionName,
          transcriptUrl,
          certificateUrl,
          nationalIdUrl,
          livePhotoUrl,
          programmeId,
          subjectIds,
          recommender,
          tutorFullName: fullName,
        })
      );

      if (signInResult?.error) {
        toast.success("Account created. Sign in to continue verification.");
        router.push("/login");
        return;
      }

      toast.success("Account created. Continue with your education details.");
      unlockAndGo("documents");
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
        clearTutorSignupDraft();
        setStep("not-qualified");
        return;
      }

      unlockAndGo("teaching");
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
        unlockAndGo("recommendation");
        toast.message("Request a recommendation from your institution");
        return;
      }

      clearTutorSignupDraft();
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
      clearTutorSignupDraft();
      setStep("complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role === "TUTOR" && !restoring && step === "account") {
    return (
      <div className="space-y-4">
        <SignedInSignupNotice targetRole="tutor" />
        <Button
          className="auth-primary-btn"
          onClick={() => router.push(routes.tutor.onboarding)}
        >
          Continue verification
        </Button>
      </div>
    );
  }

  if (session?.user?.role === "TUTOR" && !restoring && step === "complete") {
    return <SignedInSignupNotice targetRole="tutor" />;
  }

  if (restoring) {
    return (
      <div className="space-y-3 py-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0066CC] border-t-transparent" />
        <p className="text-sm text-slate-500">Restoring your application…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {session?.user && session.user.role !== "TUTOR" ? (
        <SignedInSignupNotice targetRole="tutor" />
      ) : null}

      {step !== "not-qualified" && step !== "complete" && (
        <WizardStepper
          steps={progressSteps}
          currentStepId={step}
          unlockedStepId={unlockedStep}
          onStepSelect={(id) => goToStep(id as TutorWizardStep)}
        />
      )}

      {step === "account" && (
        <form onSubmit={handleSubmit(createAccount)} className="space-y-3">
          <p className="text-xs text-slate-500">
            Step 1 of {progressSteps.length}: Create your account, then upload
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
            {accountCreated || session?.user?.role === "TUTOR" ? null : (
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1"
                onClick={() => goToStep("account")}
              >
                Back
              </Button>
            )}
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
              onClick={() => goToStep("documents")}
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
              onClick={() => goToStep("teaching")}
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
            Based on your education level, you are not eligible to tutor on ZTL at
            this time.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return home
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-3 text-center">
          <WizardStepper
            steps={progressSteps}
            currentStepId={progressSteps[progressSteps.length - 1]?.id ?? "teaching"}
            allComplete
          />
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
