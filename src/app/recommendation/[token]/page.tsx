"use client";

import { FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RecommendationUploadField } from "@/components/recommendation/recommendation-upload-field";
import { RecommenderLayout } from "@/components/recommendation/recommender-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SubmitMode = "write" | "upload";

interface RecommendationMeta {
  submitted: boolean;
  tutorName: string;
  institutionName: string | null;
    departmentName: string;
    recommenderSchoolName: string;
    tutorInstitutionName: string | null;
    message: string | null;
  recommenderName: string;
  recommenderEmail: string;
  letterText: string | null;
  letterUrl: string | null;
  submittedAt: string | null;
}

export default function RecommendationSubmitPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<SubmitMode>("write");
  const [letterText, setLetterText] = useState("");
  const [letterUrl, setLetterUrl] = useState("");
  const [meta, setMeta] = useState<RecommendationMeta | null>(null);

  useEffect(() => {
    fetch(`/api/recommendation/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setMeta(data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const onSubmit = async () => {
    const text = letterText.trim();
    const file = letterUrl.trim();

    if (!text && !file) {
      toast.error("Write a recommendation or upload a letter");
      return;
    }

    if (text && text.length < 50) {
      toast.error("Written recommendation must be at least 50 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommendation/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterText: text || undefined,
          letterUrl: file || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not submit");
      }
      toast.success("Thank you — your recommendation has been sent to ZoeLive");
      const refresh = await fetch(`/api/recommendation/${token}`).then((r) => r.json());
      setMeta(refresh);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RecommenderLayout title="Loading…" subtitle="Please wait">
        <p className="text-sm text-muted-foreground">Loading your secure link…</p>
      </RecommenderLayout>
    );
  }

  if (!meta) {
    return (
      <RecommenderLayout
        title="Invalid link"
        subtitle="This recommendation link is not valid or has expired"
      >
        <p className="text-sm text-muted-foreground">
          Contact ZoeLive support if you need a new link.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/">Return to ZoeLive</Link>
        </Button>
      </RecommenderLayout>
    );
  }

  if (meta.submitted) {
    return (
      <RecommenderLayout
        title="Recommendation received"
        subtitle={`Thank you, ${meta.recommenderName.split(" ").slice(1).join(" ") || "recommender"}`}
      >
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Your recommendation for <strong>{meta.tutorName}</strong> has been
            submitted. Our admin team will review it as part of their tutor
            verification.
          </p>
          {meta.submittedAt && (
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(meta.submittedAt).toLocaleString()}
            </p>
          )}
          {meta.letterUrl && (
            <p>
              <a
                href={meta.letterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                View uploaded letter
              </a>
            </p>
          )}
          {meta.letterText && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-medium">Your written recommendation</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {meta.letterText}
              </p>
            </div>
          )}
        </div>
      </RecommenderLayout>
    );
  }

  return (
    <RecommenderLayout
      title="Submit a letter of recommendation"
      subtitle={`For ${meta.tutorName} (student at ${meta.tutorInstitutionName ?? meta.institutionName ?? "their institution"})`}
    >
      <div className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p>
            <span className="font-medium">Recommender:</span> {meta.recommenderName}
          </p>
          <p className="mt-1">
            <span className="font-medium">Your school:</span>{" "}
            {meta.recommenderSchoolName || "—"}
          </p>
          <p className="mt-1">
            <span className="font-medium">Department:</span> {meta.departmentName}
          </p>
          <p className="mt-1 text-muted-foreground">{meta.recommenderEmail}</p>
        </div>

        {meta.message && (
          <div className="rounded-lg border border-dashed p-4 text-sm">
            <p className="font-medium">Note from the applicant</p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {meta.message}
            </p>
          </div>
        )}

        <div className="flex rounded-lg border p-1">
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "write"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode("write")}
          >
            <FileText className="h-4 w-4" />
            Write letter
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === "upload"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode("upload")}
          >
            <Upload className="h-4 w-4" />
            Upload letter
          </button>
        </div>

        {mode === "write" ? (
          <div>
            <Label htmlFor="letter">Your recommendation *</Label>
            <Textarea
              id="letter"
              rows={12}
              className="mt-1.5"
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              placeholder="Describe how you know the student, their academic performance, and why you recommend them to tutor on ZoeLive…"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum 50 characters. You may also switch to upload a signed PDF instead.
            </p>
          </div>
        ) : (
          <div>
            <Label>Upload signed letter *</Label>
            <p className="mb-3 text-xs text-muted-foreground">
              PDF or image (max 10MB). Official department letterhead is preferred.
            </p>
            <RecommendationUploadField
              token={token}
              value={letterUrl}
              onUploaded={setLetterUrl}
            />
          </div>
        )}

        {mode === "upload" && letterText.trim() && (
          <div>
            <Label htmlFor="optional-note">Optional note (in addition to file)</Label>
            <Textarea
              id="optional-note"
              rows={4}
              className="mt-1.5"
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
            />
          </div>
        )}

        <Button className="w-full" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Sending to ZoeLive…" : "Send recommendation"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By submitting, you confirm this recommendation is accurate. ZoeLive admins
          will review it before approving the tutor.
        </p>
      </div>
    </RecommenderLayout>
  );
}
