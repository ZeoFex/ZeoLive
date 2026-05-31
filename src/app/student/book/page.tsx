"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
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

export default function BookSessionPage() {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const { selectedTutorId, selectedDate, selectedTime, setTutor, setDate, setTime, reset } =
    useBookingStore();

  const subjects = ["all", ...new Set(allTutors.map((t) => t.subject))];
  const filtered =
    subjectFilter === "all"
      ? allTutors
      : allTutors.filter((t) => t.subject === subjectFilter);

  const selectedTutor = allTutors.find((t) => t.id === selectedTutorId);

  const handleBook = () => {
    toast.success("Session booked successfully!");
    setModalOpen(false);
    reset();
  };

  return (
    <>
      <DashboardHeader title="Book a session" subtitle="Find and schedule with a tutor" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap gap-4">
          <Input placeholder="Search tutors..." className="max-w-xs" />
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[180px]">
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tutor) => (
            <div key={tutor.id} onClick={() => { setTutor(tutor.id); setModalOpen(true); }}>
              <TutorCard tutor={tutor} showBook={false} />
            </div>
          ))}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book with {selectedTutor?.name}</DialogTitle>
              <DialogDescription>Select date and time for your session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  className="mt-1.5"
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time slot</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={selectedTime === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!selectedDate || !selectedTime}
                onClick={handleBook}
              >
                Confirm booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
