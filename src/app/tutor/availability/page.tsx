"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Button } from "@/components/ui/button";
import { browserTimeZone, formatSlotLabel, WEEKDAY_NAMES } from "@/lib/availability";
import { BOOKING_TIME_SLOTS } from "@/lib/constants/time-slots";
import { cn } from "@/lib/utils";

const days = [1, 2, 3, 4, 5, 6, 0];

export default function TutorAvailabilityPage() {
  const [slots, setSlots] = useState<Record<number, number[]>>({});
  const [activeDay, setActiveDay] = useState(1);
  const [timeZone, setTimeZone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classSize, setClassSize] = useState(50);
  const [requestLimit, setRequestLimit] = useState("51");
  const [requestNote, setRequestNote] = useState("");
  const [requestPending, setRequestPending] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const localZone = browserTimeZone();
    fetch("/api/tutor/availability", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Could not load your hours");
        }
        return data;
      })
      .then((data) => {
        const next: Record<number, number[]> = {};
        for (const slot of data.slots ?? []) {
          next[slot.dayOfWeek] = [...(next[slot.dayOfWeek] ?? []), slot.minutes];
        }
        setSlots(next);
        setTimeZone(data.timeZone || localZone);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load your hours")
      )
      .finally(() => setLoading(false));
    fetch("/api/tutor/participant-limit", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.limit === "number") {
          setClassSize(data.limit);
          setRequestLimit(String(data.limit + 1));
        }
        if (data.pending) setRequestPending(`Asked for ${data.pending.requestedLimit} participants`);
      })
      .catch(() => undefined);
  }, []);

  const toggleSlot = (minutes: number) => {
    setSlots((current) => {
      const daySlots = current[activeDay] ?? [];
      const next = daySlots.includes(minutes)
        ? daySlots.filter((slot) => slot !== minutes)
        : [...daySlots, minutes];
      return { ...current, [activeDay]: next };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = days.flatMap((day) =>
        (slots[day] ?? []).map((minutes) => ({ dayOfWeek: day, minutes }))
      );
      const response = await fetch("/api/tutor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ timeZone, slots: payload }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not save availability");
      toast.success("Open hours saved. Students can book only these times.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save availability");
    } finally {
      setSaving(false);
    }
  };

  const selected = slots[activeDay] ?? [];

  return (
    <>
      <TutorPageHeader
        title="Availability"
        description={`Students book only the hours you save. Each hour and each meeting holds up to ${classSize} participants. Times use ${timeZone}.`}
        actions={
          <Button className="tutor-gradient-btn rounded-xl" disabled={saving || loading} onClick={save}>
            {saving ? "Saving…" : "Save hours"}
          </Button>
        }
      />

      <section className="tutor-card mb-6 p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Need a larger class?</h2>
        <p className="mt-1 text-sm text-slate-500">
          An admin sets your participant limit. It is {classSize} for meetings and booking hours.
          {requestPending ? ` ${requestPending}.` : " Ask if you need more."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={classSize + 1}
            max={500}
            className="h-10 w-28 rounded-xl border border-slate-200 px-3 text-sm"
            value={requestLimit}
            onChange={(event) => setRequestLimit(event.target.value)}
          />
          <input
            className="h-10 min-w-48 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Why you need more seats"
            value={requestNote}
            onChange={(event) => setRequestNote(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            className="tutor-outline-btn rounded-xl"
            disabled={requesting}
            onClick={() => {
              setRequesting(true);
              fetch("/api/tutor/participant-limit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ requestedLimit: Number(requestLimit), note: requestNote }),
              })
                .then(async (response) => {
                  const json = await response.json();
                  if (!response.ok) throw new Error(json.error ?? "Could not send the request");
                  setRequestPending(`Asked for ${requestLimit} participants`);
                  toast.success("Request sent to the admins");
                })
                .catch((error) => toast.error(error instanceof Error ? error.message : "Could not send the request"))
                .finally(() => setRequesting(false));
            }}
          >
            {requesting ? "Sending…" : "Request more"}
          </Button>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Loading your hours…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="tutor-card p-5 sm:p-6 lg:col-span-1">
            <h3 className="mb-4 text-base font-bold text-slate-900">Week</h3>
            <div className="space-y-2">
              {days.map((day) => (
                <Button
                  key={day}
                  variant={activeDay === day ? "default" : "ghost"}
                  className={cn("w-full justify-start rounded-xl", activeDay === day && "tutor-gradient-btn")}
                  onClick={() => setActiveDay(day)}
                >
                  {WEEKDAY_NAMES[day]}
                  <span className="ml-auto text-xs opacity-70">{(slots[day] ?? []).length} hours</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="tutor-card p-5 sm:p-6 lg:col-span-2">
            <h3 className="mb-1 text-base font-bold text-slate-900">{WEEKDAY_NAMES[activeDay]}</h3>
            <p className="mb-4 text-sm text-slate-500">
              {selected.length === 0
                ? "No hours open. Students cannot book this day until you select and save hours."
                : selected
                    .slice()
                    .sort((a, b) => a - b)
                    .map((minutes) => formatSlotLabel(minutes))
                    .join(", ")}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BOOKING_TIME_SLOTS.map((slot, hour) => {
                const minutes = hour * 60;
                const on = selected.includes(minutes);
                return (
                  <Button
                    key={slot}
                    type="button"
                    variant={on ? "default" : "outline"}
                    className={cn(
                      "rounded-xl",
                      on ? "tutor-gradient-btn" : "tutor-outline-btn",
                      on && "ring-2 ring-sky-200"
                    )}
                    onClick={() => toggleSlot(minutes)}
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
