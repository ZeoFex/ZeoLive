"use client";

import { Suspense, useMemo, useState } from "react";
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
import { allTutors, timeSlots } from "@/lib/mock-data";
import { useBookingStore } from "@/store/booking-store";

function BookSessionContent() {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { selectedTutorId, selectedDate, selectedTime, setTutor, setDate, setTime, reset } =
    useBookingStore();

  const subjects = ["all", ...new Set(allTutors.map((t) => t.subject))];

  const filtered = useMemo(() => {
    let list = subjectFilter === "all" ? allTutors : allTutors.filter((t) => t.subject === subjectFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        [t.name, t.subject, ...t.subjects].join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [subjectFilter, search]);

  const selectedTutor = allTutors.find((t) => t.id === selectedTutorId);

  const handleBook = () => {
    toast.success("Session booked successfully!");
    setModalOpen(false);
    reset();
  };

  return (
    <>
      <StudentPageHeader
        title="Pick a tutor"
        description="Filter by subject and schedule your next live session."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Search tutors..."
          className="student-search max-w-full pl-10 sm:max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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

      {filtered.length === 0 ? (
        <div className="student-empty">No tutors match your filters.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tutor) => (
            <button
              key={tutor.id}
              type="button"
              className="cursor-pointer text-left"
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Book with {selectedTutor?.name}</DialogTitle>
            <DialogDescription>Select date and time for your session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Date</label>
              <Input
                type="date"
                className="mt-1.5 rounded-xl"
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Time slot</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
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
