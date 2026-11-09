"use client";

import { Loader2, Plus, Trash2, Upload, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LectureSubjectDto, LectureVideoDto } from "@/lib/lectures";
import { cn } from "@/lib/utils";

export default function TutorLecturesPage() {
  const [subjects, setSubjects] = useState<LectureSubjectDto[]>([]);
  const [videos, setVideos] = useState<LectureVideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [savingSubject, setSavingSubject] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/tutor/lectures", { credentials: "same-origin" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Could not load lectures");
    setSubjects(json.subjects ?? []);
    setVideos(json.videos ?? []);
    setSubjectId((current) => current || json.subjects?.[0]?.id || "");
  }, []);

  useEffect(() => {
    load()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load lectures"))
      .finally(() => setLoading(false));
  }, [load]);

  const visible = useMemo(
    () => (subjectId ? videos.filter((video) => video.subjectId === subjectId) : videos),
    [subjectId, videos]
  );

  const addSubject = async () => {
    const name = newSubject.trim();
    if (name.length < 2) {
      toast.error("Enter a subject name");
      return;
    }
    setSavingSubject(true);
    try {
      const res = await fetch("/api/tutor/lectures/subjects", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not add subject");
      setNewSubject("");
      setSubjectId(json.subject.id);
      await load();
      toast.success(json.created ? "Subject added" : "That subject is already on your list");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add subject");
    } finally {
      setSavingSubject(false);
    }
  };

  const removeSubject = async (id: string) => {
    const res = await fetch(`/api/tutor/lectures/subjects/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error ?? "Could not remove subject");
      return;
    }
    if (subjectId === id) setSubjectId("");
    await load();
  };

  const upload = async () => {
    if (!file || !subjectId || title.trim().length < 2) {
      toast.error("Add a title, choose a subject, and select a video");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("title", title.trim());
      body.set("subjectId", subjectId);
      const res = await fetch("/api/tutor/lectures", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not upload lecture");
      setTitle("");
      setFile(null);
      setFileInputKey((key) => key + 1);
      await load();
      toast.success("Lecture uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload lecture");
    } finally {
      setUploading(false);
    }
  };

  const removeVideo = async (id: string) => {
    const res = await fetch(`/api/tutor/lectures/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) {
      toast.error("Could not delete lecture");
      return;
    }
    setVideos((current) => current.filter((video) => video.id !== id));
    await load();
  };

  return (
    <>
      <TutorPageHeader
        title="Lectures"
        description="Upload videos by subject. Students who book you for that subject can watch them."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900">Subjects</h3>
            <p className="mt-1 text-xs text-slate-500">
              Subjects you already teach are listed here. Add your own if you need another category.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjects.length === 0 ? (
                <p className="text-sm text-slate-500">No subjects yet. Add one to start uploading.</p>
              ) : (
                subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                      subjectId === subject.id
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    <button type="button" onClick={() => setSubjectId(subject.id)}>
                      {subject.name}
                    </button>
                    <Badge variant="secondary" className="bg-white/80 text-slate-700">
                      {subject.videoCount}
                    </Badge>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10"
                      aria-label={`Remove ${subject.name}`}
                      onClick={() => void removeSubject(subject.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={newSubject}
                onChange={(event) => setNewSubject(event.target.value)}
                placeholder="Add your own subject"
                className="sm:max-w-xs"
              />
              <Button type="button" variant="outline" onClick={() => void addSubject()} disabled={savingSubject}>
                {savingSubject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add subject
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-900">Upload a lecture</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="lecture-title">Title</Label>
                <Input
                  id="lecture-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Introduction to integrals"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="lecture-file">Video</Label>
                <Input
                  key={fileInputKey}
                  id="lecture-file"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                  className="mt-1"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <Button type="button" className="mt-4" onClick={() => void upload()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload lecture
            </Button>
          </section>

          <section className="space-y-3">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
                <Video className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                No lectures in this subject yet.
              </div>
            ) : (
              visible.map((video) => (
                <article key={video.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{video.title}</h3>
                      <p className="text-xs text-slate-500">
                        {video.subjectName} · {video.fileSizeLabel}
                      </p>
                    </div>
                    <Button type="button" size="icon" variant="outline" onClick={() => void removeVideo(video.id)} aria-label="Delete lecture">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <video controls preload="metadata" src={video.fileUrl} className="max-h-[420px] w-full rounded-xl bg-black" />
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </>
  );
}
