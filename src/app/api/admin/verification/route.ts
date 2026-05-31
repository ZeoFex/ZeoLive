import { NextResponse } from "next/server";
import type { TutorVerificationStatus } from "@/generated/prisma";
import { requireTutorReviewAdmin } from "@/lib/admin-auth";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { serializeTutorVerification } from "@/lib/admin/serializers";

const profileInclude = {
  user: true,
  recommendations: {
    orderBy: { createdAt: "desc" as const },
    take: 3,
  },
  subadminReviews: {
    orderBy: { createdAt: "asc" as const },
  },
};

function isReviewableStatus(status: TutorVerificationStatus) {
  return (
    status === "AWAITING_REVIEW" ||
    status === "AWAITING_RECOMMENDATION" ||
    status === "AWAITING_SUPERADMIN"
  );
}

export async function GET(request: Request) {
  const authResult = await requireTutorReviewAdmin();
  if ("error" in authResult) return authResult.error;

  const { session, adminTier } = authResult;
  const viewerId = session.user.id;
  const superAdmin = isSuperAdmin(adminTier);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  const pendingStatuses: TutorVerificationStatus[] = [
    "AWAITING_REVIEW",
    "AWAITING_RECOMMENDATION",
  ];

  let where:
    | { verificationStatus: TutorVerificationStatus }
    | { verificationStatus: { in: TutorVerificationStatus[] } }
    | Record<string, never> = { verificationStatus: { in: pendingStatuses } };

  if (status === "approved") {
    where = { verificationStatus: "APPROVED" };
  } else if (status === "rejected") {
    where = { verificationStatus: "REJECTED" };
  } else if (status === "awaiting_final") {
    where = { verificationStatus: "AWAITING_SUPERADMIN" };
  } else if (status === "all") {
    where = {};
  } else if (status === "recommended" && !superAdmin) {
    where = { verificationStatus: "AWAITING_SUPERADMIN" };
  } else if (status === "pending") {
    where = superAdmin
      ? { verificationStatus: { in: pendingStatuses } }
      : { verificationStatus: { in: [...pendingStatuses, "AWAITING_SUPERADMIN"] } };
  }

  const profiles = await prisma.tutorProfile.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: profileInclude,
  });

  let items = profiles.map(serializeTutorVerification);

  if (status === "pending" && !superAdmin) {
    items = items.filter((item) => {
      if (!isReviewableStatus(item.status as TutorVerificationStatus)) return false;
      const alreadyReviewed = item.subadminReviews.some(
        (review) => review.reviewerId === viewerId
      );
      return !alreadyReviewed;
    });
  }

  if (status === "recommended" && !superAdmin) {
    items = items.filter((item) =>
      item.subadminReviews.some((review) => review.reviewerId === viewerId)
    );
  }

  return NextResponse.json({
    items,
    viewer: {
      id: viewerId,
      adminTier: adminTier ?? null,
      isSuperAdmin: superAdmin,
    },
  });
}
