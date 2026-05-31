"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeSlots } from "@/lib/mock-data";
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
      <DashboardHeader title="Availability" subtitle="Manage your weekly schedule" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {days.map((day) => (
                <Button
                  key={day}
                  variant={activeDay === day ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveDay(day)}
                >
                  {day}
                  <span className="ml-auto text-xs opacity-70">
                    {(schedule[day] ?? []).length} slots
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{activeDay}</CardTitle>
              <Button
                size="sm"
                onClick={() => toast.success("Availability saved")}
              >
                Save changes
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {timeSlots.map((slot) => {
                  const selected = (schedule[activeDay] ?? []).includes(slot);
                  return (
                    <Button
                      key={slot}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      className={cn(selected && "ring-2 ring-primary/30")}
                      onClick={() => toggleSlot(slot)}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
