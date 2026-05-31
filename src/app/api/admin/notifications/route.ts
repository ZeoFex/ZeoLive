import { NextResponse } from "next/server";
import type { TutorVerificationStatus } from "@/generated/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";
import { routes } from "@/lib/routes";

function tutorName(user: {
  name: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
}) {
  return (
    user.name ??
    buildDisplayName({
      firstName: user.firstName ?? "",
      middleName: user.middleName,
      lastName: user.lastName ?? "",
    })
  );
}

function hrefForStatus(status: TutorVerificationStatus) {
  if (status === "AWAITING_SUPERADMIN") {
    return `${routes.admin.verification}?status=awaiting_final`;
  }
  if (status === "APPROVED") {
    return `${routes.admin.verification}?status=approved`;
  }
  if (status === "REJECTED") {
    return `${routes.admin.verification}?status=rejected`;
  }
  return `${routes.admin.verification}?status=pending`;
}

export async function GET() {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { session, adminTier } = authResult;
  const superAdmin = isSuperAdmin(adminTier);
  const viewerId = session.user.id;

  const items: {
    id: string;
    type: string;
    title: string;
    message: string;
    href: string;
    createdAt: string;
  }[] = [];

  if (superAdmin) {
    const awaitingFinal = await prisma.tutorProfile.findMany({
      where: { verificationStatus: "AWAITING_SUPERADMIN" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            name: true,
          },
        },
        subadminReviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    for (const profile of awaitingFinal) {
      const name = tutorName(profile.user);
      const reviewer = profile.subadminReviews[0];
      items.push({
        id: `final-${profile.id}`,
        type: "awaiting_final",
        title: "Final approval needed",
        message: reviewer
          ? `${name} was recommended by ${reviewer.reviewerName}`
          : `${name} is ready for your final approval`,
        href: hrefForStatus("AWAITING_SUPERADMIN"),
        createdAt: (reviewer?.createdAt ?? profile.updatedAt).toISOString(),
      });
    }

    const pendingReview = await prisma.tutorProfile.findMany({
      where: {
        verificationStatus: { in: ["AWAITING_REVIEW", "AWAITING_RECOMMENDATION"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            name: true,
          },
        },
      },
    });

    for (const profile of pendingReview) {
      items.push({
        id: `pending-${profile.id}`,
        type: "pending_review",
        title: "Awaiting sub-admin review",
        message: `${tutorName(profile.user)} submitted documents for review`,
        href: hrefForStatus(profile.verificationStatus),
        createdAt: profile.updatedAt.toISOString(),
      });
    }
  } else {
    const profiles = await prisma.tutorProfile.findMany({
      where: {
        verificationStatus: {
          in: ["AWAITING_REVIEW", "AWAITING_RECOMMENDATION", "AWAITING_SUPERADMIN"],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            name: true,
          },
        },
        subadminReviews: { select: { reviewerId: true } },
        recommendations: { select: { submittedAt: true } },
      },
    });

    for (const profile of profiles) {
      const alreadyReviewed = profile.subadminReviews.some(
        (r) => r.reviewerId === viewerId
      );
      if (alreadyReviewed) continue;

      const canReview =
        profile.verificationStatus === "AWAITING_REVIEW" ||
        profile.verificationStatus === "AWAITING_SUPERADMIN" ||
        (profile.verificationStatus === "AWAITING_RECOMMENDATION" &&
          profile.recommendations.some((r) => r.submittedAt));

      if (!canReview) continue;

      items.push({
        id: `review-${profile.id}`,
        type: "needs_review",
        title: "Tutor needs your review",
        message: `${tutorName(profile.user)} is waiting for checklist verification`,
        href: `${routes.admin.verification}?status=pending`,
        createdAt: profile.updatedAt.toISOString(),
      });

      if (items.length >= 8) break;
    }
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ items: items.slice(0, 10) });
}
