"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TUTOR_VERIFICATION_CHECKLIST,
  checklistLabel,
} from "@/lib/constants/tutor-verification-checklist";
import { formatDate } from "@/lib/utils";

interface RecommendationItem {
  id: string;
  title: string;
  name: string;
  email: string;
  departmentName: string;
  recommenderSchoolName: string;
  submitted: boolean;
  submittedAt: string | null;
  letterText: string | null;
  letterUrl: string | null;
}

interface SubadminReviewItem {
  id: string;
  reviewerId: string;
  reviewerName: string;
  checkedItems: string[];
  createdAt: string;
}

interface VerificationItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  educationLevel: string | null;
  educationLevelLabel: string;
  institutionName: string | null;
  transcriptUrl: string | null;
  certificateUrl: string | null;
  nationalIdUrl: string | null;
  livePhotoUrl: string | null;
  status: string;
  submittedAt: string;
  recommendations: RecommendationItem[];
  subadminReviews: SubadminReviewItem[];
  subadminReviewCount: number;
}

function statusBadgeVariant(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED" || status === "NOT_QUALIFIED") return "destructive" as const;
  if (status === "AWAITING_SUPERADMIN") return "default" as const;
  return "warning" as const;
}

function statusLabel(status: string) {
  if (status === "AWAITING_SUPERADMIN") return "awaiting super admin";
  return status.replace(/_/g, " ").toLowerCase();
}

function recommendationSummary(item: VerificationItem) {
  if (item.educationLevel !== "UNDERGRADUATE_CONTINUING") {
    return "—";
  }
  const rec = item.recommendations[0];
  if (!rec) return "Not requested";
  if (rec.submitted) return "Received";
  return "Awaiting recommender";
}

function canSubadminReviewItem(item: VerificationItem, viewerId: string | undefined) {
  if (!viewerId) return false;
  if (item.subadminReviews.some((review) => review.reviewerId === viewerId)) {
    return false;
  }
  if (item.status === "AWAITING_REVIEW" || item.status === "AWAITING_SUPERADMIN") {
    return true;
  }
  if (item.status === "AWAITING_RECOMMENDATION") {
    return item.recommendations.some((r) => r.submitted);
  }
  return false;
}

function canSuperadminFinalReview(item: VerificationItem) {
  return item.status === "AWAITING_SUPERADMIN";
}

export default function AdminVerificationPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const viewerId = session?.user?.id;
  const isSuperAdmin = session?.user?.adminTier === "SUPERADMIN";

  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(
    () => searchParams.get("status") ?? "pending"
  );
  const [preview, setPreview] = useState<VerificationItem | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams.get("status")) return;
    if (isSuperAdmin) {
      setFilter("awaiting_final");
    }
  }, [isSuperAdmin, searchParams]);

  const filterOptions = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { value: "pending", label: "Pending sub-admin review" },
        { value: "awaiting_final", label: "Awaiting final approval" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "all", label: "All" },
      ];
    }
    return [
      { value: "pending", label: "Needs my review" },
      { value: "recommended", label: "I recommended" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
      { value: "all", label: "All" },
    ];
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verification?status=${filter}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setItems(json.items ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load applications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCheckedItems([]);
  }, [preview?.id]);

  const handleSubadminRecommend = async (id: string) => {
    if (checkedItems.length === 0) {
      toast.error("Select at least one checklist item");
      return;
    }

    setActing(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recommend", checkedItems }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      toast.success("Recommendation sent to super admin");
      await load();
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      toast.success("Tutor rejected");
      await load();
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setActing(null);
    }
  };

  const handleSuperadminApprove = async (id: string) => {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      toast.success("Tutor approved — they can now access their dashboard");
      await load();
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setActing(null);
    }
  };

  const toggleCheckedItem = (id: string, checked: boolean) => {
    setCheckedItems((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    );
  };

  const subtitle = isSuperAdmin
    ? "Review sub-admin recommendations and give final approval for tutors"
    : "Review documents and recommend tutors to the super admin";

  return (
    <>
      <DashboardHeader title="Tutor Verification" subtitle={subtitle} />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading applications…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications in this list.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Education</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Recommendation</TableHead>
                {isSuperAdmin && <TableHead>Sub-admin recommendations</TableHead>}
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.email}</div>
                  </TableCell>
                  <TableCell>{v.educationLevelLabel}</TableCell>
                  <TableCell>{v.institutionName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        recommendationSummary(v) === "Received"
                          ? "success"
                          : recommendationSummary(v) === "Awaiting recommender"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {recommendationSummary(v)}
                    </Badge>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      {v.subadminReviewCount > 0 ? (
                        <div className="space-y-1">
                          <Badge variant="success">
                            {v.subadminReviewCount} recommendation
                            {v.subadminReviewCount === 1 ? "" : "s"}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {v.subadminReviews.map((r) => r.reviewerName).join(", ")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None yet</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{formatDate(v.submittedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(v.status)}>
                      {statusLabel(v.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setPreview(v)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application — {preview?.name}</DialogTitle>
            </DialogHeader>
            {preview && (
              <div className="space-y-4 text-sm">
                <p>
                  <span className="font-medium">Education:</span>{" "}
                  {preview.educationLevelLabel}
                </p>
                <p>
                  <span className="font-medium">Institution:</span>{" "}
                  {preview.institutionName ?? "—"}
                </p>

                <DocumentLink label="Transcript" url={preview.transcriptUrl} />
                <DocumentLink label="National ID" url={preview.nationalIdUrl} />
                <DocumentLink label="Certificate" url={preview.certificateUrl} />
                <DocumentLink label="Live photo" url={preview.livePhotoUrl} image />

                {preview.recommendations.length > 0 && (
                  <RecommendationsPanel recommendations={preview.recommendations} />
                )}

                {preview.subadminReviews.length > 0 && (
                  <SubadminReviewsPanel reviews={preview.subadminReviews} />
                )}

                {preview.status === "AWAITING_RECOMMENDATION" &&
                  !preview.recommendations.some((r) => r.submitted) && (
                    <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">
                      Waiting for the faculty recommender to submit their letter via
                      the email link.
                    </p>
                  )}

                {!isSuperAdmin && canSubadminReviewItem(preview, viewerId) && (
                  <VerificationChecklist
                    checkedItems={checkedItems}
                    onToggle={toggleCheckedItem}
                  />
                )}

                {!isSuperAdmin && canSubadminReviewItem(preview, viewerId) && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      disabled={acting === preview.id}
                      onClick={() => handleSubadminRecommend(preview.id)}
                    >
                      Recommend to super admin
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={acting === preview.id}
                      onClick={() => handleReject(preview.id)}
                    >
                      Reject tutor
                    </Button>
                  </div>
                )}

                {!isSuperAdmin &&
                  preview.subadminReviews.some((r) => r.reviewerId === viewerId) && (
                    <p className="rounded-lg border bg-muted/40 p-3 text-muted-foreground">
                      You recommended this tutor on{" "}
                      {formatDate(
                        preview.subadminReviews.find((r) => r.reviewerId === viewerId)!
                          .createdAt
                      )}
                      . Waiting for super admin final approval.
                    </p>
                  )}

                {isSuperAdmin && canSuperadminFinalReview(preview) && (
                  <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="font-semibold">Final approval</p>
                    <p className="text-muted-foreground">
                      {preview.subadminReviewCount} sub-admin
                      {preview.subadminReviewCount === 1 ? " has" : "s have"} recommended
                      this tutor. Review their checklist responses above, then approve or
                      reject.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        disabled={acting === preview.id}
                        onClick={() => handleSuperadminApprove(preview.id)}
                      >
                        Approve tutor (final)
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={acting === preview.id}
                        onClick={() => handleReject(preview.id)}
                      >
                        Reject tutor
                      </Button>
                    </div>
                  </div>
                )}

                {isSuperAdmin && !canSuperadminFinalReview(preview) && (
                  <p className="text-xs text-muted-foreground">
                    Final approval is available after a sub-admin recommends this tutor.
                  </p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function VerificationChecklist({
  checkedItems,
  onToggle,
}: {
  checkedItems: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="font-semibold">Verification checklist</p>
      <p className="text-xs text-muted-foreground">
        Tick each item you have verified. Your name and selections will be sent to the
        super admin.
      </p>
      <div className="space-y-3">
        {TUTOR_VERIFICATION_CHECKLIST.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <Checkbox
              id={item.id}
              checked={checkedItems.includes(item.id)}
              onCheckedChange={(value) => onToggle(item.id, value === true)}
            />
            <Label htmlFor={item.id} className="cursor-pointer leading-snug font-normal">
              {item.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubadminReviewsPanel({ reviews }: { reviews: SubadminReviewItem[] }) {
  return (
    <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div>
        <p className="font-semibold">
          Sub-admin recommendations ({reviews.length})
        </p>
        <p className="text-xs text-muted-foreground">
          Each sub-admin ticked the verification questions they confirmed. Use these
          responses when giving final approval.
        </p>
      </div>
      {reviews.map((review) => (
        <div key={review.id} className="space-y-2 rounded-md border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{review.reviewerName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Verified ({review.checkedItems.length}):
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs">
            {review.checkedItems.map((item) => (
              <li key={item}>{checklistLabel(item)}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RecommendationsPanel({
  recommendations,
}: {
  recommendations: RecommendationItem[];
}) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <p className="font-semibold">Faculty recommendation</p>
      {recommendations.map((r) => (
        <div key={r.id} className="space-y-2 rounded-md border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {r.title === "DR" ? "Dr" : "Prof"} {r.name}
            </p>
            <Badge variant={r.submitted ? "success" : "warning"}>
              {r.submitted ? "Submitted" : "Pending"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{r.email}</p>
          <p className="text-xs text-muted-foreground">
            Lectures at: {r.recommenderSchoolName || "—"} · {r.departmentName}
          </p>
          {r.submittedAt && (
            <p className="text-xs text-muted-foreground">
              Received {formatDate(r.submittedAt)}
            </p>
          )}
          {r.letterUrl && (
            <a
              href={r.letterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              View uploaded letter <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {r.letterText && (
            <div className="mt-2 rounded border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Written recommendation
              </p>
              <p className="mt-2 whitespace-pre-wrap">{r.letterText}</p>
            </div>
          )}
          {r.submitted && !r.letterUrl && !r.letterText && (
            <p className="text-xs text-muted-foreground">No content on file.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DocumentLink({
  label,
  url,
  image,
}: {
  label: string;
  url: string | null;
  image?: boolean;
}) {
  if (!url) {
    return (
      <p>
        <span className="font-medium">{label}:</span>{" "}
        <span className="text-muted-foreground">Not provided</span>
      </p>
    );
  }

  return (
    <div>
      <p className="font-medium">{label}</p>
      {image ? (
        <div className="mt-2 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="max-h-48 w-full object-contain bg-muted" />
        </div>
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
      >
        View file <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
