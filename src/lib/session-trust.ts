export const REPORT_REASONS = [
  "Harassment",
  "Inappropriate content",
  "Disruption",
  "Safety concern",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export function attendanceKey(identity: string, guest: boolean) {
  if (!guest) return identity;
  const guestId = identity.split(":")[1];
  return guestId ? `guest:${guestId}` : identity;
}

export function averageRating(ratings: number[]) {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function canLeaveReview(input: {
  status: string;
  viewerId: string;
  viewerRole: string;
  tutorId: string;
  studentId: string;
  participantIds: string[];
  attended: boolean;
}) {
  const onSession =
    input.viewerId === input.studentId || input.participantIds.includes(input.viewerId);
  return (
    input.status === "COMPLETED" &&
    input.viewerRole === "STUDENT" &&
    input.viewerId !== input.tutorId &&
    input.attended &&
    onSession
  );
}
