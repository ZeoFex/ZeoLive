"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TUTOR_EDUCATION_LEVELS,
  tutorRequiresCertificate,
  tutorRequiresRecommendation,
  type TutorEducationLevelValue,
} from "@/lib/constants/registration";
import { cn } from "@/lib/utils";

export function EducationLevelFields({
  educationLevel,
  onEducationLevelChange,
  compact = false,
}: {
  educationLevel: TutorEducationLevelValue | "";
  onEducationLevelChange: (value: TutorEducationLevelValue) => void;
  compact?: boolean;
}) {
  const needsCertificate =
    educationLevel && tutorRequiresCertificate(educationLevel);
  const needsRecommendation =
    educationLevel && tutorRequiresRecommendation(educationLevel);

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3")}>
      <div>
        <Label>Level of education *</Label>
        <Select
          value={educationLevel}
          onValueChange={(v) => onEducationLevelChange(v as TutorEducationLevelValue)}
        >
          <SelectTrigger className={compact ? undefined : "mt-1.5"}>
            <SelectValue placeholder="Select your level" />
          </SelectTrigger>
          <SelectContent>
            {TUTOR_EDUCATION_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {educationLevel && !compact && (
          <p className="mt-2 text-sm text-muted-foreground">
            {
              TUTOR_EDUCATION_LEVELS.find((l) => l.value === educationLevel)
                ?.description
            }
          </p>
        )}
      </div>

      {educationLevel && (
        <ul
          className={cn(
            "rounded-lg border border-slate-200 bg-slate-50/90 text-slate-600",
            compact
              ? "space-y-0.5 px-2.5 py-2 text-[11px] leading-snug"
              : "space-y-1 p-3 text-xs"
          )}
        >
          {compact ? (
            <>
              <li>
                Required: transcript, national ID, live photo
                {needsCertificate ? ", certificate" : ""}
                {needsRecommendation ? ", faculty recommendation" : ""}.
              </li>
            </>
          ) : (
            <>
              <li>• Transcript and national ID required for all levels</li>
              <li>• Live photo required for identity verification</li>
              {needsCertificate && (
                <li>• Diploma, degree, or postgraduate certificate required</li>
              )}
              {needsRecommendation && (
                <li>• Letter of recommendation from your institution required</li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
