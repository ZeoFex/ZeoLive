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
import { browserTimeZone } from "@/lib/availability";
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
  const [startNow, setStartNow] = useState(false);
  const [bookingSubject, setBookingSubject] = useState("");
  const [openSlots, setOpenSlots] = useState<
    { label: string; scheduledAt: string; full: boolean; seatsTaken: number; seatLimit: number }[]
  >([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [hoursPublished, setHoursPublished] = useState(true);
  const [startNowOpen, setStartNowOpen] = useState(false);
  const [chosenSlot, setChosenSlot] = useState("");
  const timeZone = browserTimeZone();
  const { selectedTutorId, selectedDate, setTutor, setDate, setTime, reset } = useBookingStore();

  useEffect(() => {
    const tutorsQuery = new URLSearchParams({ timeZone: browserTimeZone() });
    fetch(`/api/tutors?${tutorsQuery}`, { credentials: "same-origin" })
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

  useEffect(() => {
    if (!selectedTutor) return;
    const preferred =
      subjectFilter !== "all" && selectedTutor.subjects.includes(subjectFilter)
        ? subjectFilter
        : selectedTutor.subjects[0] ?? "";
    setBookingSubject(preferred);
  }, [selectedTutor, subjectFilter]);

  useEffect(() => {
    if (!modalOpen || !selectedTutorId || !selectedDate) return;
    setSlotsLoading(true);
    const query = new URLSearchParams({ date: selectedDate, timeZone });
    fetch(`/api/tutors/${selectedTutorId}/open-slots?${query}`, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        setOpenSlots(data.slots ?? []);
        setHoursPublished(data.published !== false);
        setStartNowOpen(data.startNowOpen === true);
        setChosenSlot("");
      })
      .catch(() => {
        setOpenSlots([]);
        setHoursPublished(false);
      })
      .finally(() => setSlotsLoading(false));
  }, [modalOpen, selectedTutorId, selectedDate, timeZone]);

  const handleBook = async () => {
    const slot = openSlots.find((item) => item.scheduledAt === chosenSlot);
    if (!selectedTutorId || !bookingSubject || (!startNow && !slot)) return;

    const scheduledAt = startNow ? new Date() : new Date(slot!.scheduledAt);

    try {
      const res = await fetch("/api/tutoring-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: selectedTutorId,
          title: selectedTutor ? `Session with ${selectedTutor.name}` : "Tutoring session",
          subject: bookingSubject,
          scheduledAt: scheduledAt.toISOString(),
          startNow,
          timeZone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not book session");
      }
      toast.success(
        json.alreadyBooked
          ? "You are already booked for this time."
          : json.grouped
            ? "You are in the same session as the other students booked for this time."
            : "Session booked."
      );
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
                setDate(new Date().toLocaleDateString("en-CA"));
                setTime("");
                setChosenSlot("");
                setStartNow(false);
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
            <div>
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <Select value={bookingSubject} onValueChange={setBookingSubject}>
                <SelectTrigger className="mt-1 h-10 w-full rounded-xl">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedTutor?.subjects ?? []).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                You will see this tutor&apos;s lecture videos for the subject you book.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <Checkbox
                id="startNow"
                checked={startNow}
                disabled={!startNowOpen}
                onCheckedChange={(v) => setStartNow(v === true)}
              />
              <div>
                <Label htmlFor="startNow" className="text-sm font-medium text-slate-800">
                  Start session now
                </Label>
                <p className="mt-0.5 text-xs text-slate-500">
                  {startNowOpen
                    ? "This tutor is open during the current hour."
                    : "This tutor is not open during the current hour."}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Date</label>
              <Input
                type="date"
                className="student-input"
                value={selectedDate ?? ""}
                disabled={startNow}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className={startNow ? "pointer-events-none opacity-50" : undefined}>
              <label className="text-sm font-medium text-slate-700">Open hours · {timeZone}</label>
              {slotsLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading open hours…</p>
              ) : !hoursPublished ? (
                <p className="mt-2 text-sm text-slate-500">
                  This tutor has not published open hours yet.
                </p>
              ) : openSlots.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No open hours on this date.</p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {openSlots.map((slot) => (
                    <Button
                      key={slot.scheduledAt}
                      type="button"
                      variant={chosenSlot === slot.scheduledAt ? "default" : "outline"}
                      disabled={slot.full}
                      className={
                        chosenSlot === slot.scheduledAt
                          ? "student-gradient-btn rounded-xl border-0"
                          : "student-outline-btn rounded-xl"
                      }
                      size="sm"
                      onClick={() => setChosenSlot(slot.scheduledAt)}
                    >
                      {slot.full ? `${slot.label} · Full` : slot.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="student-gradient-btn w-full rounded-xl"
              disabled={!bookingSubject || (startNow ? !startNowOpen : !chosenSlot)}
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
