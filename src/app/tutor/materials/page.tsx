"use client";

import {
  Check,
  Download,
  FileText,
  Loader2,
  Share2,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudyMaterialDto } from "@/lib/study-materials";
import { cn } from "@/lib/utils";

type StudentOption = {
  id: string;
  name: string;
  image: string | null;
  sessionCount: number;
};

function StudentPicker({
  students,
  selected,
  onToggle,
  onSelectAll,
}: {
  students: StudentOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  if (students.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        No students yet. Students appear here after they book a session with you.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg"
        onClick={onSelectAll}
      >
        <Users className="mr-2 h-4 w-4" />
        {selected.size === students.length ? "Clear all" : "Select all students"}
      </Button>
      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
        {students.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
              <Checkbox
                checked={selected.has(s.id)}
                onCheckedChange={() => onToggle(s.id)}
              />
              <Avatar className="h-8 w-8">
                {s.image ? <AvatarImage src={s.image} alt={s.name} /> : null}
                <AvatarFallback>{s.name[0]}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                {s.name}
              </span>
              <span className="text-xs text-slate-400">{s.sessionCount} sessions</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TutorMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterialDto[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [shareMaterialId, setShareMaterialId] = useState<string | null>(null);
  const [shareStudentIds, setShareStudentIds] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterialDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, stuRes] = await Promise.all([
        fetch("/api/tutor/materials", { credentials: "same-origin" }),
        fetch("/api/tutor/students", { credentials: "same-origin" }),
      ]);
      const matJson = await matRes.json();
      const stuJson = await stuRes.json();
      if (!matRes.ok) throw new Error(matJson.error ?? "Could not load materials");
      setMaterials(matJson.materials ?? []);
      setStudents(stuJson.students ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStudent = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const selectAllStudents = (
    set: Set<string>,
    setter: (s: Set<string>) => void
  ) => {
    if (set.size === students.length) {
      setter(new Set());
    } else {
      setter(new Set(students.map((s) => s.id)));
    }
  };

  const uploadAndShare = async () => {
    if (!file) {
      toast.error("Choose a file to upload");
      return;
    }
    if (selectedStudentIds.size === 0) {
      toast.error("Select at least one student");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title.trim() || file.name);
      if (description.trim()) form.append("description", description.trim());
      form.append("studentIds", JSON.stringify([...selectedStudentIds]));

      const res = await fetch("/api/tutor/materials", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      toast.success(json.message ?? "Material shared");
      setFile(null);
      setTitle("");
      setDescription("");
      setSelectedStudentIds(new Set());
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const shareExisting = async () => {
    if (!shareMaterialId || shareStudentIds.size === 0) {
      toast.error("Select students to share with");
      return;
    }

    setSharing(true);
    try {
      const res = await fetch(`/api/tutor/materials/${shareMaterialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ studentIds: [...shareStudentIds] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not share");
      toast.success(json.message ?? "Shared with more students");
      setShareMaterialId(null);
      setShareStudentIds(new Set());
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share");
    } finally {
      setSharing(false);
    }
  };

  const performDelete = async () => {
    if (!materialToDelete) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/tutor/materials/${materialToDelete.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      toast.success("Material removed for all students");
      setMaterialToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <TutorPageHeader
        title="Materials"
        description="Upload study resources and share them instantly with selected students."
      />

      <div className="tutor-card mb-6 space-y-5 p-5 sm:p-6">
        <div>
          <h3 className="font-semibold text-slate-900">Upload & share</h3>
          <p className="mt-1 text-sm text-slate-500">
            PDF, Word, PowerPoint, images, or text — up to platform upload limit.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Label htmlFor="material-file">File</Label>
            <label
              htmlFor="material-file"
              className={cn(
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-6 transition-colors hover:bg-sky-50"
              )}
            >
              <Upload className="mb-2 h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium text-slate-800">
                {file ? file.name : "Choose file or drag here"}
              </span>
              <input
                id="material-file"
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="space-y-2">
              <Label htmlFor="material-title" className="tutor-label">
                Title (optional)
              </Label>
              <Input
                id="material-title"
                className="tutor-input"
                placeholder={file?.name ?? "e.g. Week 3 — Integration notes"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-desc" className="tutor-label">
                Note for students (optional)
              </Label>
              <Textarea
                id="material-desc"
                className="tutor-textarea"
                rows={2}
                placeholder="What this file covers…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share with students</Label>
            <StudentPicker
              students={students}
              selected={selectedStudentIds}
              onToggle={(id) => toggleStudent(id, selectedStudentIds, setSelectedStudentIds)}
              onSelectAll={() => selectAllStudents(selectedStudentIds, setSelectedStudentIds)}
            />
          </div>
        </div>

        <Button
          type="button"
          className="tutor-gradient-btn w-full rounded-xl sm:w-auto"
          disabled={uploading || !file || selectedStudentIds.size === 0}
          onClick={() => void uploadAndShare()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          Upload and send to {selectedStudentIds.size || "…"} student
          {selectedStudentIds.size === 1 ? "" : "s"}
        </Button>
      </div>

      {shareMaterialId && (
        <div className="tutor-card mb-6 space-y-4 border-sky-200 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">Share with more students</h3>
              <p className="text-sm text-slate-500">
                Add recipients for an existing material.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShareMaterialId(null);
                setShareStudentIds(new Set());
              }}
            >
              Cancel
            </Button>
          </div>
          <StudentPicker
            students={students}
            selected={shareStudentIds}
            onToggle={(id) => toggleStudent(id, shareStudentIds, setShareStudentIds)}
            onSelectAll={() => selectAllStudents(shareStudentIds, setShareStudentIds)}
          />
          <Button
            type="button"
            className="tutor-gradient-btn rounded-xl"
            disabled={sharing || shareStudentIds.size === 0}
            onClick={() => void shareExisting()}
          >
            {sharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send to selected students
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : materials.length === 0 ? (
        <div className="tutor-card px-6 py-12 text-center text-sm text-slate-500">
          No materials uploaded yet. Share your first file above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {materials.map((m) => (
            <div key={m.id} className="tutor-card group flex flex-col p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{m.title}</p>
                  <p className="text-sm text-slate-500">
                    {m.fileSizeLabel} · {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Shared with {m.shareCount} student{m.shareCount === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
              {m.description && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{m.description}</p>
              )}
              {m.shares.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                  {m.shares.slice(0, 4).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 text-xs text-slate-500"
                    >
                      {s.viewedAt ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                      )}
                      <span className="truncate">{s.studentName}</span>
                    </li>
                  ))}
                  {m.shares.length > 4 && (
                    <li className="text-xs text-slate-400">
                      +{m.shares.length - 4} more
                    </li>
                  )}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  asChild
                >
                  <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1.5 h-4 w-4" />
                    Preview
                  </a>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    setShareMaterialId(m.id);
                    setShareStudentIds(new Set());
                  }}
                >
                  <Share2 className="mr-1.5 h-4 w-4" />
                  Share more
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setMaterialToDelete(m)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!materialToDelete}
        onOpenChange={(open) => !open && !deleteLoading && setMaterialToDelete(null)}
      >
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <div className="bg-gradient-to-b from-red-50 to-white px-6 pb-2 pt-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <DialogHeader className="space-y-2 sm:text-center">
              <DialogTitle>Remove this material?</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <strong className="text-slate-900">{materialToDelete?.title}</strong>{" "}
                    will be deleted for all {materialToDelete?.shareCount} student
                    {materialToDelete?.shareCount === 1 ? "" : "s"} who received it.
                  </p>
                  <p className="text-xs font-medium text-red-600">
                    Students will no longer be able to download this file.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={deleteLoading}
              onClick={() => setMaterialToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={deleteLoading}
              onClick={() => void performDelete()}
            >
              {deleteLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete material
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
