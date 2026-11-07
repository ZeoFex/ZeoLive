"use client";

import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_TUTOR_SUBJECTS } from "@/lib/constants/programmes";
import { cn } from "@/lib/utils";

export interface ProgrammeOption {
  id: string;
  name: string;
  subjects: Array<{ id: string; name: string }>;
}

interface TeachingProgrammeFieldsProps {
  programmeId: string;
  subjectIds: string[];
  onProgrammeChange: (programmeId: string) => void;
  onSubjectIdsChange: (subjectIds: string[]) => void;
  compact?: boolean;
}

export function TeachingProgrammeFields({
  programmeId,
  subjectIds,
  onProgrammeChange,
  onSubjectIdsChange,
  compact = false,
}: TeachingProgrammeFieldsProps) {
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/programmes")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load programmes");
        if (!cancelled) {
          setProgrammes(json.programmes ?? []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load programmes");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProgramme = useMemo(
    () => programmes.find((programme) => programme.id === programmeId) ?? null,
    [programmes, programmeId]
  );

  const toggleSubject = (subjectId: string, checked: boolean) => {
    if (checked) {
      if (subjectIds.includes(subjectId) || subjectIds.length >= MAX_TUTOR_SUBJECTS) {
        return;
      }
      onSubjectIdsChange([...subjectIds, subjectId]);
      return;
    }
    onSubjectIdsChange(subjectIds.filter((id) => id !== subjectId));
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2.5")}>
      <div>
        <Label htmlFor="programme">Tertiary programme *</Label>
        <Select
          value={programmeId || undefined}
          onValueChange={(value) => {
            onProgrammeChange(value);
            onSubjectIdsChange([]);
          }}
          disabled={loading || !!error}
        >
          <SelectTrigger id="programme" className="mt-1.5">
            <SelectValue
              placeholder={loading ? "Loading programmes…" : "Select your programme"}
            />
          </SelectTrigger>
          <SelectContent>
            {programmes.map((programme) => (
              <SelectItem key={programme.id} value={programme.id}>
                {programme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      {selectedProgramme && (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label>Subjects you can teach *</Label>
            <span className="text-xs text-slate-500">
              {subjectIds.length}/{MAX_TUTOR_SUBJECTS} selected
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Choose up to {MAX_TUTOR_SUBJECTS} subjects from {selectedProgramme.name}.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {selectedProgramme.subjects.map((subject) => {
              const checked = subjectIds.includes(subject.id);
              const disabled =
                !checked && subjectIds.length >= MAX_TUTOR_SUBJECTS;
              return (
                <label
                  key={subject.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition-colors",
                    checked && "border-sky-300 bg-sky-50",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) =>
                      toggleSubject(subject.id, value === true)
                    }
                  />
                  <span>{subject.name}</span>
                </label>
              );
            })}
          </div>
          {selectedProgramme.subjects.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              This programme has no active subjects yet. Ask an admin to add some.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
