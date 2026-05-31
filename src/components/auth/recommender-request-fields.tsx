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
}

export function RecommenderRequestFields({
  values,
  onChange,
  emailPreview,
}: RecommenderRequestFieldsProps) {
  return (
    <div className="space-y-4">
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

      <div>
        <Label htmlFor="recommenderSchool">
          School / institution where they lecture *
        </Label>
        <Input
          id="recommenderSchool"
          className="mt-1.5"
          placeholder="e.g. University of Ghana"
          value={values.recommenderSchoolName}
          onChange={(e) => onChange("recommenderSchoolName", e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          The tertiary school where this faculty member teaches (may differ from your
          school as a student).
        </p>
      </div>

      <div>
        <Label htmlFor="department">Department *</Label>
        <Input
          id="department"
          className="mt-1.5"
          placeholder="e.g. Department of Mathematics"
          value={values.departmentName}
          onChange={(e) => onChange("departmentName", e.target.value)}
        />
      </div>

      <div>
        <Label>Recommender email *</Label>
        <Input
          type="email"
          className="mt-1.5"
          value={values.recommenderEmail}
          onChange={(e) => onChange("recommenderEmail", e.target.value)}
        />
      </div>

      <div>
        <Label>Phone (optional)</Label>
        <Input
          type="tel"
          className="mt-1.5"
          value={values.recommenderPhone}
          onChange={(e) => onChange("recommenderPhone", e.target.value)}
        />
      </div>

      <div>
        <Label>Message for recommender (optional)</Label>
        <Textarea
          className="mt-1.5"
          rows={3}
          value={values.message}
          onChange={(e) => onChange("message", e.target.value)}
        />
      </div>

      {emailPreview && (
        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
          {emailPreview}
        </div>
      )}
    </div>
  );
}
