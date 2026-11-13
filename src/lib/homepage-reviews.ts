import { displayUserName } from "@/lib/portal-data";
import { prisma } from "@/lib/prisma";

export type HomepageReview = {
  id: string;
  studentName: string;
  tutorName: string;
  rating: number;
  comment: string;
  image: string | null;
};

export async function listHomepageReviews(limit = 6): Promise<HomepageReview[]> {
  const rows = await prisma.sessionReview.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      student: { select: { name: true, firstName: true, lastName: true, email: true, image: true } },
      tutor: { select: { name: true, firstName: true, lastName: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    studentName: displayUserName(row.student),
    tutorName: displayUserName(row.tutor),
    rating: row.rating,
    comment: row.comment?.trim() ?? "",
    image: row.student.image,
  }));
}
