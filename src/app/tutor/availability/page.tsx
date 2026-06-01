"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Button } from "@/components/ui/button";
import { BOOKING_TIME_SLOTS } from "@/lib/constants/time-slots";
import { cn } from "@/lib/utils";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TutorAvailabilityPage() {
  const [schedule, setSchedule] = useState<Record<string, string[]>>({
    Monday: ["10:00 AM", "2:00 PM"],
    Wednesday: ["9:00 AM", "11:00 AM", "3:00 PM"],
    Friday: ["1:00 PM", "4:00 PM"],
  });
  const [activeDay, setActiveDay] = useState("Monday");

  const toggleSlot = (slot: string) => {
    setSchedule((prev) => {
      const daySlots = prev[activeDay] ?? [];
      const next = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [activeDay]: next };
    });
  };

  return (
    <>
      <TutorPageHeader
        title="Availability"
        description="Manage your weekly schedule so students can book sessions."
        actions={
          <Button
            className="tutor-gradient-btn rounded-xl"
            onClick={() => toast.success("Availability saved")}
          >
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="tutor-card p-5 sm:p-6 lg:col-span-1">
          <h3 className="mb-4 text-base font-bold text-slate-900">Week</h3>
          <div className="space-y-2">
            {days.map((day) => (
              <Button
                key={day}
                variant={activeDay === day ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start rounded-xl",
                  activeDay === day && "tutor-gradient-btn"
                )}
                onClick={() => setActiveDay(day)}
              >
                {day}
                <span className="ml-auto text-xs opacity-70">
                  {(schedule[day] ?? []).length} slots
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="tutor-card p-5 sm:p-6 lg:col-span-2">
          <h3 className="mb-4 text-base font-bold text-slate-900">{activeDay}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BOOKING_TIME_SLOTS.map((slot) => {
              const selected = (schedule[activeDay] ?? []).includes(slot);
              return (
                <Button
                  key={slot}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className={cn(
                    "rounded-xl",
                    selected ? "tutor-gradient-btn" : "tutor-outline-btn",
                    selected && "ring-2 ring-violet-200"
                  )}
                  onClick={() => toggleSlot(slot)}
                >
                  {slot}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
