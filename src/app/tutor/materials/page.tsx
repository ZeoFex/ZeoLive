"use client";

import { FileText, Trash2 } from "lucide-react";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";

const materials = [
  { id: "1", name: "Calculus II — Integration Notes.pdf", size: "2.4 MB", date: "May 18" },
  { id: "2", name: "Practice Problems Set 4.pdf", size: "1.1 MB", date: "May 15" },
  { id: "3", name: "Algebra Cheat Sheet.pdf", size: "890 KB", date: "May 10" },
];

export default function TutorMaterialsPage() {
  return (
    <>
      <TutorPageHeader
        title="Materials"
        description="Upload and share learning resources with your students."
      />

      <FileUpload
        label="Upload new material"
        accept=".pdf,.doc,.docx,image/*"
        className="tutor-card mb-6 p-5 sm:p-6"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {materials.map((m) => (
          <div key={m.id} className="tutor-card group p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
                <FileText className="h-6 w-6 text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{m.name}</p>
                <p className="text-sm text-slate-500">
                  {m.size} · {m.date}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
