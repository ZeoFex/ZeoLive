import { prisma } from "../src/lib/prisma.ts";

const profiles = await prisma.tutorProfile.findMany({
  select: { userId: true, participantLimit: true },
});
let updated = 0;
for (const profile of profiles) {
  const result = await prisma.tutoringSession.updateMany({
    where: { tutorId: profile.userId, status: { in: ["SCHEDULED", "ACTIVE"] } },
    data: { seatLimit: profile.participantLimit },
  });
  updated += result.count;
}
console.log("sessions_updated", updated, "tutors", profiles.length);
await prisma.$disconnect();
