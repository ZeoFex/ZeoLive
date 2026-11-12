"use client";

import { Check, Copy, Loader2, Search, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MeetingCamera } from "@/components/meetings/meeting-camera";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; email?: string };

export function ScheduleMeetingDialog({
  onScheduled,
}: {
  onScheduled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Person[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [startNow, setStartNow] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/tutor/lectures", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((lectureJson) => {
        const taught = ((lectureJson.subjects ?? []) as { name: string }[]).map((s) => s.name);
        const profile = (lectureJson.profileSubjects ?? []) as string[];
        const names = [...new Set([...taught, ...profile].map((name) => name.trim()).filter(Boolean))];
        setSubjects(names);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const handle = window.setTimeout(() => {
      setSearching(true);
      void fetch(`/api/tutor/student-search?q=${encodeURIComponent(query.trim())}`, {
        credentials: "same-origin",
      })
        .then((r) => r.json())
        .then((json) => {
          const found = (json.students ?? []) as Person[];
          setStudents((current) => {
            const map = new Map(current.map((student) => [student.id, student]));
            for (const student of found) map.set(student.id, student);
            return [...map.values()];
          });
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  const toggleStudent = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const reset = () => {
    setSelectedIds([]);
    setTitle("");
    setSubject("");
    setCustomSubject("");
    setDate("");
    setTime("");
    setStartNow(false);
    setQuery("");
    setJoinUrl("");
    setCopied(false);
    setStudents([]);
  };

  const chosenSubject = (customSubject.trim() || subject).trim();

  const schedule = async () => {
    if (title.trim().length < 2) {
      toast.error("Add a meeting title");
      return;
    }
    if (chosenSubject.length < 2) {
      toast.error("Select a subject or add one");
      return;
    }
    if (!startNow && (!date || !time)) {
      toast.error("Choose a date and time");
      return;
    }

    let scheduledAt = new Date().toISOString();
    if (!startNow) {
      const [hour, minute] = time.split(":").map((part) => parseInt(part, 10));
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        toast.error("Enter a time");
        return;
      }
      const [year, month, day] = date.split("-").map((part) => parseInt(part, 10));
      scheduledAt = new Date(year, month - 1, day, hour, minute).toISOString();
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tutor/meetings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedIds,
          subject: chosenSubject,
          title: title.trim(),
          scheduledAt,
          startNow,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not schedule the meeting");
      setJoinUrl(json.joinUrl ?? "");
      toast.success(
        selectedIds.length > 0
          ? "Meeting link sent to the invited students"
          : "Meeting ready. Copy the link and share it."
      );
      onScheduled?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule the meeting");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Join link copied");
  };

  const visible = students.filter((student) => {
    const selected = selectedIds.includes(student.id);
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return selected;
    return (
      selected ||
      student.name.toLowerCase().includes(needle) ||
      (student.email ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="tutor-gradient-btn rounded-xl">
          <Video className="mr-2 h-4 w-4" />
          Schedule meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <MeetingCamera className="h-10 w-10 rounded-xl" />
            <DialogTitle>Schedule a meeting</DialogTitle>
          </div>
        </DialogHeader>

        {joinUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Share this link. People enter the name they want shown, choose microphone and
              camera, then join. No account is required.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm break-all text-slate-800">
              {joinUrl}
            </div>
            <Button type="button" className="w-full rounded-xl" onClick={() => void copyLink()}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy join link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-title">Meeting title</Label>
              <Input
                id="meeting-title"
                className="mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Week 4 revision"
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="meeting-subject">Subject</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {subjects.map((name) => {
                  const typed = customSubject.trim().toLowerCase();
                  const selected = typed
                    ? name.toLowerCase() === typed
                    : subject.toLowerCase() === name.toLowerCase();
                  return (
                    <Button
                      key={name}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        "rounded-full border-slate-300 bg-white text-slate-700 hover:bg-white",
                        selected &&
                          "border-transparent bg-[#0066CC] text-white hover:bg-[#0054a6]"
                      )}
                      onClick={() => {
                        setSubject(name);
                        setCustomSubject("");
                      }}
                    >
                      {name}
                    </Button>
                  );
                })}
                {customSubject.trim() &&
                !subjects.some(
                  (name) => name.toLowerCase() === customSubject.trim().toLowerCase()
                ) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full border-transparent bg-[#0066CC] text-white hover:bg-[#0054a6]"
                  >
                    {customSubject.trim()}
                  </Button>
                ) : null}
              </div>
              <Input
                id="meeting-subject"
                className="mt-2"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Or add a subject"
                maxLength={60}
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <Checkbox
                id="meeting-now"
                checked={startNow}
                onCheckedChange={(value) => setStartNow(value === true)}
              />
              <div>
                <Label htmlFor="meeting-now">Start now</Label>
                <p className="text-xs text-slate-500">Students can enter as soon as they open the link.</p>
              </div>
            </div>

            {!startNow && (
              <>
                <div>
                  <Label htmlFor="meeting-date">Date</Label>
                  <Input
                    id="meeting-date"
                    type="date"
                    className="mt-1"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="meeting-time">Time</Label>
                  <Input
                    id="meeting-time"
                    type="time"
                    className="mt-1"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="student-search">Invite students</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="student-search"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email"
                />
              </div>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {searching && visible.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-500">Searching…</p>
                ) : visible.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-500">
                    {query.trim().length < 2
                      ? "Search by name or email to invite a student."
                      : "No student matches that search."}
                  </p>
                ) : (
                  visible.map((student) => {
                    const selected = selectedIds.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                          selected ? "bg-sky-50" : "hover:bg-slate-50"
                        )}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            selected
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-slate-300"
                          )}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-900">{student.name}</span>
                          {student.email ? (
                            <span className="block truncate text-xs text-slate-500">
                              {student.email}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <Button
              type="button"
              className="tutor-gradient-btn w-full rounded-xl"
              disabled={saving}
              onClick={() => void schedule()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create meeting link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
