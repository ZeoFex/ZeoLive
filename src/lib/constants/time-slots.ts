function formatHourSlot(hour24: number) {
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00 ${period}`;
}

/** Every hour from 12:00 AM (00:00) through 11:00 PM. */
export const BOOKING_TIME_SLOTS = Array.from({ length: 24 }, (_, hour) =>
  formatHourSlot(hour)
);
