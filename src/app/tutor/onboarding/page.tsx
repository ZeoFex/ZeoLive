"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DocumentUploadField } from "@/components/auth/document-upload-field";
import { EducationLevelFields } from "@/components/auth/education-level-fields";
import { LivePhotoCapture } from "@/components/auth/live-photo-capture";
import { AuthLayout } from "@/components/auth/auth-layout";
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

type Step = "verification" | "recommendation" | "not-qualified" | "complete";

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
    fetch("/api/tutor/onboarding/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.verificationStatus === "APPROVED") {
          router.replace("/tutor/dashboard");
        }
      })
      .catch(() => {});

    fetch("/api/tutor/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.fullName) setTutorFullName(data.fullName);
      })
      .catch(() => {});
  }, [router]);

  const needsCertificate =
    educationLevel && tutorRequiresCertificate(educationLevel);
  const needsRecommendation =
    educationLevel && tutorRequiresRecommendation(educationLevel);

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

      if (json.needsRecommendation) {
        setStep("recommendation");
        toast.message("Request a letter of recommendation from your institution");
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
        throw new Error(json.error ?? "Could not send");
      }

      if (json.devMode) {
        toast.success(
          "Saved. Check the server console for the recommender link (SMTP not configured)."
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

  return (
    <AuthLayout
      title="Tutor verification"
      subtitle="Complete education verification: Undergraduate, Diploma/HND, Graduate, or Postgraduate."
      headline="Complete Your Tutor Verification"
      highlightWord="Verification"
    >
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

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Required documents</p>
            <p className="text-xs text-muted-foreground">
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

          <Button className="w-full" onClick={sendRecommendation} disabled={loading}>
            {loading ? "Sending…" : "Send recommendation request"}
          </Button>
        </div>
      )}

      {step === "not-qualified" && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Based on your education level, you are not eligible to tutor on ZoeLive at this
            time.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return home
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Your verification has been submitted. Check your email for login instructions.
            Our team will review your documents and notify you when your profile is approved.
          </p>
          <Button onClick={() => router.push("/login")}>Go to login</Button>
        </div>
      )}
    </AuthLayout>
  );
}
