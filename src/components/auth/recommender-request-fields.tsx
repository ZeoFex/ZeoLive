"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RECOMMENDER_TITLES } from "@/lib/constants/registration";
import { cn } from "@/lib/utils";

export type RecommenderFormValues = {
  title: "DR" | "PROF";
  recommenderFirstName: string;
  recommenderLastName: string;
  recommenderSchoolName: string;
  departmentName: string;
  recommenderEmail: string;
  recommenderPhone: string;
  message: string;
};

interface RecommenderRequestFieldsProps {
  values: RecommenderFormValues;
  onChange: <K extends keyof RecommenderFormValues>(
    key: K,
    value: RecommenderFormValues[K]
  ) => void;
  emailPreview?: string;
  compact?: boolean;
}

export function RecommenderRequestFields({
  values,
  onChange,
  emailPreview,
  compact = false,
}: RecommenderRequestFieldsProps) {
  return (
    <div className={cn(compact ? "space-y-2.5" : "space-y-4")}>
      {compact ? (
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div>
            <Label>Title *</Label>
            <Select
              value={values.title}
              onValueChange={(v) => onChange("title", v as "DR" | "PROF")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECOMMENDER_TITLES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>First name *</Label>
            <Input
              value={values.recommenderFirstName}
              onChange={(e) => onChange("recommenderFirstName", e.target.value)}
            />
          </div>
          <div>
            <Label>Last name *</Label>
            <Input
              value={values.recommenderLastName}
              onChange={(e) => onChange("recommenderLastName", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          <div>
            <Label>Title *</Label>
            <Select
              value={values.title}
              onValueChange={(v) => onChange("title", v as "DR" | "PROF")}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECOMMENDER_TITLES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Recommender first name *</Label>
              <Input
                className="mt-1.5"
                value={values.recommenderFirstName}
                onChange={(e) => onChange("recommenderFirstName", e.target.value)}
              />
            </div>
            <div>
              <Label>Recommender last name *</Label>
              <Input
                className="mt-1.5"
                value={values.recommenderLastName}
                onChange={(e) => onChange("recommenderLastName", e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div className={cn("grid gap-2.5", compact ? "sm:grid-cols-2" : "gap-4")}>
        <div>
          <Label htmlFor="recommenderSchool">
            {compact ? "School / institution *" : "School / institution where they lecture *"}
          </Label>
          <Input
            id="recommenderSchool"
            className={compact ? undefined : "mt-1.5"}
            placeholder="e.g. University of Ghana"
            value={values.recommenderSchoolName}
            onChange={(e) => onChange("recommenderSchoolName", e.target.value)}
          />
          {!compact && (
            <p className="mt-1 text-xs text-muted-foreground">
              The tertiary school where this faculty member teaches (may differ from your
              school as a student).
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            className={compact ? undefined : "mt-1.5"}
            placeholder="e.g. Department of Mathematics"
            value={values.departmentName}
            onChange={(e) => onChange("departmentName", e.target.value)}
          />
        </div>
      </div>

      <div className={cn("grid gap-2.5", compact ? "sm:grid-cols-2" : "gap-4")}>
        <div>
          <Label>{compact ? "Email *" : "Recommender email *"}</Label>
          <Input
            type="email"
            className={compact ? undefined : "mt-1.5"}
            value={values.recommenderEmail}
            onChange={(e) => onChange("recommenderEmail", e.target.value)}
          />
        </div>
        <div>
          <Label>Phone (optional)</Label>
          <Input
            type="tel"
            className={compact ? undefined : "mt-1.5"}
            value={values.recommenderPhone}
            onChange={(e) => onChange("recommenderPhone", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>{compact ? "Message (optional)" : "Message for recommender (optional)"}</Label>
        <Textarea
          className={compact ? undefined : "mt-1.5"}
          rows={compact ? 2 : 3}
          value={values.message}
          onChange={(e) => onChange("message", e.target.value)}
        />
      </div>

      {emailPreview && !compact && (
        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
          {emailPreview}
        </div>
      )}
      {emailPreview && compact && (
        <details className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700">
            Preview email to recommender
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans leading-snug">{emailPreview}</pre>
        </details>
      )}
    </div>
  );
}
