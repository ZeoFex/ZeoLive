"use client";

import { Loader2, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Badge } from "@/components/ui/badge";
import type { LectureVideoDto } from "@/lib/lectures";

export default function StudentLecturesPage() {
  const [videos, setVideos] = useState<LectureVideoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/lectures", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load lectures");
      setVideos(json.videos ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load lectures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const subjects = useMemo(
    () => ["all", ...new Set(videos.map((video) => video.subjectName))],
    [videos]
  );
  const visible = filter === "all" ? videos : videos.filter((video) => video.subjectName === filter);

  return (
    <>
      <StudentPageHeader
        title="Lectures"
        description="Videos from tutors you have booked, for the subject you chose."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : videos.length === 0 ? (
        <div className="student-card px-6 py-12 text-center text-sm text-slate-500">
          <Video className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p>No lectures yet.</p>
          <p className="mt-1 text-xs">
            Book a tutor and choose a subject. Their uploaded videos for that subject will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => setFilter(subject)}
                className={
                  filter === subject
                    ? "rounded-full bg-sky-600 px-3 py-1.5 text-sm text-white"
                    : "rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                }
              >
                {subject === "all" ? "All subjects" : subject}
              </button>
            ))}
          </div>
          {visible.map((video) => (
            <article key={video.id} className="student-card p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{video.title}</h3>
                <Badge variant="secondary">{video.subjectName}</Badge>
              </div>
              <p className="mb-3 text-sm text-slate-500">
                {video.tutor?.name ?? "Tutor"} · {video.fileSizeLabel}
              </p>
              <video controls preload="metadata" src={video.fileUrl} className="max-h-[420px] w-full rounded-xl bg-black" />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
