"use client";

import {
  Download,
  Loader2,
  Play,
  Upload,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandedRecordingPlayer } from "@/components/recordings/branded-recording-player";
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
import type { RecordingListItem } from "@/lib/recordings";
import { formatDate } from "@/lib/utils";

interface RecordingsLibraryProps {
  mode: "student" | "tutor" | "admin";
  allowUpload?: boolean;
}

export function RecordingsLibrary({
  mode,
  allowUpload = false,
}: RecordingsLibraryProps) {
  const [recordings, setRecordings] = useState<RecordingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [sessions, setSessions] = useState<{ id: string; label: string }[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recordings", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load recordings");
      setRecordings(json.recordings ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load recordings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    if (!allowUpload) return;
    try {
      const res = await fetch("/api/recordings/sessions", {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) return;
      setSessions(json.sessions ?? []);
    } catch {
      /* ignore */
    }
  }, [allowUpload]);

  useEffect(() => {
    void load();
    void loadSessions();
  }, [load, loadSessions]);

  const watch = async (item: RecordingListItem) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/recordings/${item.id}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not open recording");
      setActiveId(item.id);
      setActiveSrc(json.recording.fileUrl);
      setActiveTitle(json.recording.title);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open recording");
    } finally {
      setBusyId(null);
    }
  };

  const requestDownload = async (item: RecordingListItem) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/recordings/${item.id}/download-request`, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not request download");
      toast.success(json.message ?? "Download request sent");
      await load();

      if (json.request?.status === "APPROVED" && json.request?.downloadToken) {
        await startDownload(item.id, json.request.downloadToken);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not request download");
    } finally {
      setBusyId(null);
    }
  };

  const startDownload = async (recordingId: string, token?: string) => {
    setBusyId(recordingId);
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/recordings/${recordingId}/download${qs}`, {
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Download not available");

      const link = document.createElement("a");
      link.href = json.downloadUrl;
      link.download = json.fileName || "ztl-recording.mp4";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  };

  const upload = async () => {
    if (!sessionId || !uploadFile) {
      toast.error("Choose a session and video file");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("tutoringSessionId", sessionId);
      form.set("title", uploadTitle);
      form.set("file", uploadFile);
      const res = await fetch("/api/recordings", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Recording uploaded");
      setUploadFile(null);
      setUploadTitle("");
      setSessionId("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const statusBadge = (item: RecordingListItem) => {
    const status = item.downloadRequest?.status;
    if (!status) return null;
    const styles =
      status === "APPROVED"
        ? "bg-emerald-50 text-emerald-700"
        : status === "PENDING"
          ? "bg-amber-50 text-amber-700"
          : status === "REJECTED"
            ? "bg-red-50 text-red-700"
            : "bg-slate-100 text-slate-600";
    return <Badge className={styles}>{status.toLowerCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {allowUpload ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Upload a recorded lesson
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Session</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select completed session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="recording-title">Title</Label>
              <Input
                id="recording-title"
                className="mt-1.5"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Optional title"
              />
            </div>
            <div>
              <Label htmlFor="recording-file">Video file</Label>
              <Input
                id="recording-file"
                className="mt-1.5"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={() => void upload()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload recording"
            )}
          </Button>
        </div>
      ) : null}

      {activeSrc ? (
        <BrandedRecordingPlayer src={activeSrc} title={activeTitle} />
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          <Video className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p>No recordings yet.</p>
          <p className="mt-1 text-xs">
            {mode === "student"
              ? "When your tutors upload lesson recordings, they will appear here for watch later."
              : "Upload completed lesson videos so students and tutors can watch later in ZTL."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    {statusBadge(item)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.subject || item.sessionTitle || "Lesson"} ·{" "}
                    {formatDate(item.scheduledAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {mode === "student"
                      ? `Tutor: ${item.tutorName}`
                      : `Student: ${item.studentName} · Tutor: ${item.tutorName}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => void watch(item)}
                  >
                    {busyId === item.id && activeId !== item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Watch in ZTL
                  </Button>

                  {item.canDownloadRequest ? (
                    item.downloadRequest?.status === "APPROVED" ? (
                      <Button
                        size="sm"
                        disabled={busyId === item.id}
                        onClick={() => void startDownload(item.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download now
                      </Button>
                    ) : item.downloadRequest?.status === "PENDING" ? (
                      <Button size="sm" variant="secondary" disabled>
                        Waiting for admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === item.id}
                        onClick={() => void requestDownload(item)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Request download
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === item.id}
                      onClick={() => void startDownload(item.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
