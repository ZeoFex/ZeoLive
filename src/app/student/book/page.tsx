"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { TutorCard } from "@/components/shared/tutor-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOKING_TIME_SLOTS } from "@/lib/constants/time-slots";
import { resolveBookingScheduledAt } from "@/lib/booking-schedule";
import { useBookingStore } from "@/store/booking-store";
import type { Tutor } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function BookSessionContent() {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [startNow, setStartNow] = useState(true);
  const { selectedTutorId, selectedDate, selectedTime, setTutor, setDate, setTime, reset } =
    useBookingStore();

  useEffect(() => {
    fetch("/api/tutors", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setTutors(data.tutors ?? []))
      .catch(() => setTutors([]))
      .finally(() => setLoadingTutors(false));
  }, []);

  const subjects = useMemo(
    () => ["all", ...new Set(tutors.flatMap((t) => t.subjects))],
    [tutors]
  );

  const filtered = useMemo(() => {
    let list =
      subjectFilter === "all"
        ? tutors
        : tutors.filter((t) => t.subjects.includes(subjectFilter));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.name, t.subject, ...t.subjects].join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [subjectFilter, search, tutors]);

  const selectedTutor = tutors.find((t) => t.id === selectedTutorId);

  const handleBook = async () => {
    if (!selectedTutorId || !selectedDate || !selectedTime) return;

    const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hour = 12;
    let minute = 0;
    if (timeMatch) {
      hour = parseInt(timeMatch[1]!, 10);
      minute = parseInt(timeMatch[2]!, 10);
      const ampm = timeMatch[3]!.toUpperCase();
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
    }

    const scheduledAt = resolveBookingScheduledAt(
      selectedDate,
      hour,
      minute,
      startNow
    );

    try {
      const res = await fetch("/api/tutoring-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: selectedTutorId,
          title: selectedTutor ? `Session with ${selectedTutor.name}` : "Tutoring session",
          subject: selectedTutor?.subject,
          scheduledAt: scheduledAt.toISOString(),
          startNow,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not book session");
      }
      toast.success("Session booked! Payment step skipped for now.");
      setModalOpen(false);
      reset();
      if (json.classroomUrl) {
        window.location.href = json.classroomUrl;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not book session");
    }
  };

  return (
    <>
      <StudentPageHeader
        title="Pick a tutor"
        description="Book a verified tutor for your next live session."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tutors..."
            className="student-search w-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All subjects" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingTutors ? (
        <p className="text-sm text-slate-500">Loading tutors…</p>
      ) : filtered.length === 0 ? (
        <div className="student-empty py-12 text-center text-sm text-slate-500">
          {tutors.length === 0
            ? "No approved tutors are available yet. Tutors appear here after admin verification."
            : "No tutors match your filters."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tutor) => (
            <button
              key={tutor.id}
              type="button"
              className="text-left"
              onClick={() => {
                setTutor(tutor.id);
                setModalOpen(true);
              }}
            >
              <TutorCard tutor={tutor} showBook={false} />
            </button>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-2xl sm:w-full">
          <DialogHeader>
            <DialogTitle>Book with {selectedTutor?.name}</DialogTitle>
            <DialogDescription>Select date and time for your session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <Checkbox
                id="startNow"
                checked={startNow}
                onCheckedChange={(v) => setStartNow(v === true)}
              />
              <div>
                <Label htmlFor="startNow" className="text-sm font-medium text-slate-800">
                  Start session now
                </Label>
                <p className="mt-0.5 text-xs text-slate-500">
                  Recommended if you want to join the classroom right after booking.
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Date</label>
              <Input
                type="date"
                className="mt-1.5 rounded-xl"
                disabled={startNow}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className={startNow ? "pointer-events-none opacity-50" : undefined}>
              <label className="text-sm font-medium text-slate-700">Time slot</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {BOOKING_TIME_SLOTS.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedTime === slot ? "default" : "outline"}
                    className={
                      selectedTime === slot
                        ? "student-gradient-btn rounded-xl border-0"
                        : "student-outline-btn rounded-xl"
                    }
                    size="sm"
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="student-gradient-btn w-full rounded-xl"
              disabled={!selectedDate || !selectedTime}
              onClick={handleBook}
            >
              Confirm booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function BookSessionPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <BookSessionContent />
    </Suspense>
  );
}
