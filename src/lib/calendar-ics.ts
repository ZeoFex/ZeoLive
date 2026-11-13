function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildSessionIcs(params: {
  uid: string;
  title: string;
  start: Date;
  durationMinutes?: number;
  url: string;
  description: string;
}) {
  const end = new Date(params.start.getTime() + (params.durationMinutes ?? 60) * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ZTL//Sessions//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}@ztl`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(params.start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escapeIcs(params.title)}`,
    `DESCRIPTION:${escapeIcs(params.description)}`,
    `URL:${params.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
