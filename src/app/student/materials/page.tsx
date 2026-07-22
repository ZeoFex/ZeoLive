"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentMaterialDto } from "@/lib/study-materials";

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<StudentMaterialDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/materials", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load materials");
      setMaterials(json.materials ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markViewedAndDownload = async (item: StudentMaterialDto) => {
    if (item.isNew) {
      try {
        await fetch(`/api/student/materials/${item.shareId}`, {
          method: "PATCH",
          credentials: "same-origin",
        });
        setMaterials((prev) =>
          prev.map((m) =>
            m.shareId === item.shareId
              ? { ...m, isNew: false, viewedAt: new Date().toISOString() }
              : m
          )
        );
      } catch {
        /* non-blocking */
      }
    }

    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.download = item.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const newCount = materials.filter((m) => m.isNew).length;

  return (
    <>
      <StudentPageHeader
        title="Study materials"
        description="Files your tutors have shared with you. Download anytime."
        actions={
          newCount > 0 ? (
            <Badge className="bg-blue-600 hover:bg-blue-600">
              {newCount} new
            </Badge>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : materials.length === 0 ? (
        <div className="student-card px-6 py-12 text-center text-sm text-slate-500">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p>No materials yet.</p>
          <p className="mt-1 text-xs">
            When a tutor shares notes or files with you, they will show up here immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((item) => (
            <div
              key={item.shareId}
              className="student-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    {item.isNew && (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        New
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Avatar className="h-6 w-6">
                      {item.tutor.image ? (
                        <AvatarImage src={item.tutor.image} alt={item.tutor.name} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {item.tutor.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>From {item.tutor.name}</span>
                    <span>·</span>
                    <span>{item.fileSizeLabel}</span>
                    <span>·</span>
                    <span>
                      Shared {new Date(item.sharedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                className="student-gradient-btn shrink-0 rounded-xl"
                onClick={() => void markViewedAndDownload(item)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
