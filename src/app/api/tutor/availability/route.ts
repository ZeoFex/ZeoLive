import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isKnownTimeZone } from "@/lib/availability";
import { loadTutorHours, normalizeAvailabilitySlots } from "@/lib/booking-hours";
import { prisma } from "@/lib/prisma";

const saveSchema = z.object({
  timeZone: z.string().min(1),
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int(),
      minutes: z.number().int(),
    })
  ),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hours = await loadTutorHours(session.user.id);
    return NextResponse.json({
      timeZone: hours.tutor?.timeZone ?? null,
      slots: hours.slots,
    });
  } catch (error) {
    console.error("Load availability error:", error);
    return NextResponse.json({ error: "Could not load your hours" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "TUTOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = saveSchema.parse(await request.json());
    if (!isKnownTimeZone(data.timeZone)) {
      return NextResponse.json({ error: "Choose a valid timezone" }, { status: 400 });
    }
    const slots = normalizeAvailabilitySlots(data.slots);
    if (!slots) {
      return NextResponse.json({ error: "Choose whole hours only" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { timeZone: data.timeZone },
    });
    await prisma.tutorAvailabilitySlot.deleteMany({ where: { tutorId: session.user.id } });
    if (slots.length > 0) {
      await prisma.tutorAvailabilitySlot.createMany({
        data: slots.map((slot) => ({
          tutorId: session.user.id,
          dayOfWeek: slot.dayOfWeek,
          minutes: slot.minutes,
        })),
      });
    }

    return NextResponse.json({ ok: true, slots });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Save availability error:", error);
    return NextResponse.json({ error: "Could not save availability" }, { status: 500 });
  }
}
