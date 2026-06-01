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

export function EducationLevelFields({
  educationLevel,
  onEducationLevelChange,
}: {
  educationLevel: TutorEducationLevelValue | "";
  onEducationLevelChange: (value: TutorEducationLevelValue) => void;
}) {
  const needsCertificate =
    educationLevel && tutorRequiresCertificate(educationLevel);
  const needsRecommendation =
    educationLevel && tutorRequiresRecommendation(educationLevel);

  return (
    <div className="space-y-3">
      <div>
        <Label>Level of education *</Label>
        <Select
          value={educationLevel}
          onValueChange={(v) => onEducationLevelChange(v as TutorEducationLevelValue)}
        >
          <SelectTrigger className="mt-1.5">
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
        {educationLevel && (
          <p className="mt-2 text-sm text-muted-foreground">
            {
              TUTOR_EDUCATION_LEVELS.find((l) => l.value === educationLevel)
                ?.description
            }
          </p>
        )}
      </div>

      {educationLevel && (
        <ul className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/90 p-3 text-xs text-slate-600">
          <li>• Transcript and national ID required for all levels</li>
          <li>• Live photo required for identity verification</li>
          {needsCertificate && (
            <li>• Diploma, degree, or postgraduate certificate required</li>
          )}
          {needsRecommendation && (
            <li>• Letter of recommendation from your institution required</li>
          )}
        </ul>
      )}
    </div>
  );
}
