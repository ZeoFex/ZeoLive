"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DocumentUploadField } from "@/components/auth/document-upload-field";
import { EducationLevelFields } from "@/components/auth/education-level-fields";
import { LivePhotoCapture } from "@/components/auth/live-photo-capture";
import { AuthLayout } from "@/components/auth/auth-layout";
import { TeachingProgrammeFields } from "@/components/auth/teaching-programme-fields";
import { WizardStepper } from "@/components/auth/wizard-stepper";
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
import {
  clearTutorSignupDraft,
  readTutorSignupDraft,
  writeTutorSignupDraft,
  emptyTutorSignupDraft,
} from "@/lib/tutor-signup-draft";

type Step = "verification" | "teaching" | "recommendation" | "not-qualified" | "complete";

export default function TutorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("verification");
  const [loading, setLoading] = useState(false);

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
  const [tutorFullName, setTutorFullName] = useState("");

  useEffect(() => {
    const localDraft = readTutorSignupDraft();
    if (localDraft) {
      if (localDraft.educationLevel) setEducationLevel(localDraft.educationLevel);
      if (localDraft.institutionName) setInstitutionName(localDraft.institutionName);
      if (localDraft.transcriptUrl) setTranscriptUrl(localDraft.transcriptUrl);
      if (localDraft.certificateUrl) setCertificateUrl(localDraft.certificateUrl);
      if (localDraft.nationalIdUrl) setNationalIdUrl(localDraft.nationalIdUrl);
      if (localDraft.livePhotoUrl) setLivePhotoUrl(localDraft.livePhotoUrl);
      if (localDraft.programmeId) setProgrammeId(localDraft.programmeId);
      if (localDraft.subjectIds?.length) setSubjectIds(localDraft.subjectIds);
      if (localDraft.recommender) setRecommender(localDraft.recommender);
      if (localDraft.tutorFullName) setTutorFullName(localDraft.tutorFullName);
    }

    fetch("/api/tutor/onboarding/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.verificationStatus === "APPROVED" || data.onboardingComplete) {
          clearTutorSignupDraft();
          router.replace("/tutor/dashboard");
          return;
        }
        if (data.educationLevel) setEducationLevel(data.educationLevel);
        if (data.institutionName) setInstitutionName(data.institutionName);
        if (data.transcriptUrl) setTranscriptUrl(data.transcriptUrl);
        if (data.certificateUrl) setCertificateUrl(data.certificateUrl);
        if (data.nationalIdUrl) setNationalIdUrl(data.nationalIdUrl);
        if (data.livePhotoUrl) setLivePhotoUrl(data.livePhotoUrl);
        if (data.programmeId) setProgrammeId(data.programmeId);
        if (data.subjectIds?.length) setSubjectIds(data.subjectIds);
        if (data.tutorFullName) setTutorFullName(data.tutorFullName);

        if (data.verificationStatus === "AWAITING_RECOMMENDATION") {
          setStep("recommendation");
          return;
        }
        if (data.hasDocuments && !data.hasTeaching) {
          setStep("teaching");
          return;
        }
        if (localDraft?.step === "teaching") setStep("teaching");
        if (localDraft?.step === "recommendation") setStep("recommendation");
      })
      .catch(() => {});

    fetch("/api/tutor/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.fullName) setTutorFullName(data.fullName);
        if (data.institutionName) setInstitutionName(data.institutionName);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (step === "complete" || step === "not-qualified") return;
    writeTutorSignupDraft(
      emptyTutorSignupDraft({
        step:
          step === "verification"
            ? "documents"
            : step === "teaching"
              ? "teaching"
              : "recommendation",
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
      })
    );
  }, [
    step,
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

  const needsCertificate =
    educationLevel && tutorRequiresCertificate(educationLevel);
  const needsRecommendation =
    educationLevel && tutorRequiresRecommendation(educationLevel);

  const progressSteps = useMemo(() => {
    const base = [
      { id: "verification", label: "Education & documents" },
      { id: "teaching", label: "Programme & subjects" },
    ];
    if (needsRecommendation) {
      return [...base, { id: "recommendation", label: "Recommendation" }];
    }
    return base;
  }, [needsRecommendation]);

  const submitVerification = async () => {
    if (!educationLevel || !institutionName.trim()) {
      toast.error("Select education level and enter your institution");
      return;
    }
    if (!transcriptUrl || !nationalIdUrl || !livePhotoUrl) {
      toast.error("Upload all required documents");
      return;
    }
    if (needsCertificate && !certificateUrl) {
      toast.error("Certificate is required for your education level");
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
        throw new Error(json.error ?? "Could not save");
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
        toast.message("Request a letter of recommendation from your institution");
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
        throw new Error(json.error ?? "Could not send");
      }

      if (json.devMode) {
        toast.success(
          "Saved. Check the server console for the recommender link (SMTP not configured)."
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

  return (
    <AuthLayout
      title="Tutor verification"
      subtitle="Complete education verification, choose what you teach, then finish the last review step."
      headline="Complete Your Tutor Verification"
      highlightWord="Verification"
    >
      <div className="auth-form space-y-5">
      {step !== "not-qualified" && step !== "complete" ? (
        <WizardStepper steps={progressSteps} currentStepId={step} />
      ) : null}
      {step === "verification" && (
        <div className="space-y-6">
          <EducationLevelFields
            educationLevel={educationLevel}
            onEducationLevelChange={setEducationLevel}
          />

          <div>
            <Label htmlFor="institution">Name of tertiary institution (completed / attending) *</Label>
            <Input
              id="institution"
              className="mt-1.5"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
          </div>

          <div className="auth-verification-panel">
            <p>Required documents</p>
            <p>
              Upload transcript, national ID, and a live photo. Certificate required for
              Diploma/HND, Graduate, and Postgraduate levels.
            </p>
            <DocumentUploadField
              label="Transcript"
              accept=".pdf,image/*"
              folder="tutor/transcripts"
              value={transcriptUrl}
              onUploaded={setTranscriptUrl}
            />
            {needsCertificate && (
              <DocumentUploadField
                label="Certificate"
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
            <LivePhotoCapture
              value={livePhotoUrl}
              onCaptured={setLivePhotoUrl}
            />
          </div>

          <Button className="w-full" onClick={submitVerification} disabled={loading}>
            {loading ? "Saving…" : "Continue"}
          </Button>
        </div>
      )}

      {step === "teaching" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Select the tertiary programme you studied and choose up to three subjects
            you can teach. This comes before the final verification step.
          </p>

          <TeachingProgrammeFields
            programmeId={programmeId}
            subjectIds={subjectIds}
            onProgrammeChange={setProgrammeId}
            onSubjectIdsChange={setSubjectIds}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep("verification")}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={submitTeaching} disabled={loading}>
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
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            As a continuing undergraduate student, ask a faculty member to submit a letter of
            recommendation. We will email them a secure link.
          </p>

          <RecommenderRequestFields
            values={recommender}
            onChange={patchRecommender}
            emailPreview={buildRecommendationEmailPreview({
              recommender,
              tutorFullName: tutorFullName || "[Tutor name]",
              tutorInstitutionName: institutionName || "[Your institution]",
            })}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep("teaching")}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={sendRecommendation} disabled={loading}>
              {loading ? "Sending…" : "Send recommendation request"}
            </Button>
          </div>
        </div>
      )}

      {step === "not-qualified" && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Based on your education level, you are not eligible to tutor on Zeolive at this
            time.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return home
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-4 text-center">
          <WizardStepper
            steps={progressSteps}
            currentStepId={progressSteps[progressSteps.length - 1]?.id ?? "teaching"}
            allComplete
          />
          <p className="text-sm text-muted-foreground">
            Your verification has been submitted. Check your email for login instructions.
            Our team will review your documents and notify you when your profile is approved.
          </p>
          <Button onClick={() => router.push("/login")}>Go to login</Button>
        </div>
      )}
      </div>
    </AuthLayout>
  );
}
