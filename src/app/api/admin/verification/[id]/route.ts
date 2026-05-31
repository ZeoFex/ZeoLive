import { NextResponse } from "next/server";
import { z } from "zod";
import type { TutorVerificationStatus } from "@/generated/prisma";
import { requireTutorReviewAdmin } from "@/lib/admin-auth";
import { isSuperAdmin } from "@/lib/admin-permissions";
import {
  TUTOR_VERIFICATION_CHECKLIST_IDS,
} from "@/lib/constants/tutor-verification-checklist";
import { sendTutorDecisionEmail, notifySuperadminsOfTutorRecommendation } from "@/lib/email/tutor";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";

const subadminActionSchema = z.object({
  action: z.enum(["recommend", "reject"]),
  checkedItems: z.array(z.string()).optional(),
});

const superadminActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

function canSubadminReview(params: {
  status: TutorVerificationStatus;
  recommendations: { submittedAt: Date | null }[];
}) {
  if (params.status === "AWAITING_REVIEW") return true;
  if (params.status === "AWAITING_SUPERADMIN") return true;
  if (params.status === "AWAITING_RECOMMENDATION") {
    return params.recommendations.some((r) => r.submittedAt);
  }
  return false;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireTutorReviewAdmin();
  if ("error" in authResult) return authResult.error;

  const { session, adminTier } = authResult;
  const superAdmin = isSuperAdmin(adminTier);
  const { id } = await params;

  try {
    const body = await request.json();

    const profile = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        recommendations: true,
        subadminReviews: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    const tutorName = buildDisplayName({
      firstName: profile.user.firstName ?? "",
      middleName: profile.user.middleName,
      lastName: profile.user.lastName ?? "",
    });

    if (superAdmin) {
      const { action } = superadminActionSchema.parse(body);

      if (action === "approve" && profile.verificationStatus !== "AWAITING_SUPERADMIN") {
        return NextResponse.json(
          {
            error:
              "This tutor is still awaiting sub-admin review. Final approval is available after a sub-admin recommends them.",
          },
          { status: 400 }
        );
      }

      if (action === "approve" && profile.subadminReviews.length === 0) {
        return NextResponse.json(
          {
            error:
              "At least one sub-admin must recommend this tutor before you can give final approval.",
          },
          { status: 400 }
        );
      }

      const approved = action === "approve";
      const verificationStatus = approved ? "APPROVED" : "REJECTED";

      await prisma.tutorProfile.update({
        where: { id },
        data: {
          verificationStatus,
          verified: approved,
          onboardingComplete: true,
        },
      });

      try {
        await sendTutorDecisionEmail({
          to: profile.user.email,
          tutorName,
          approved,
        });
      } catch (emailError) {
        console.error("Tutor decision email failed:", emailError);
      }

      return NextResponse.json({ success: true, verificationStatus });
    }

    const { action, checkedItems } = subadminActionSchema.parse(body);

    if (action === "reject") {
      await prisma.tutorProfile.update({
        where: { id },
        data: {
          verificationStatus: "REJECTED",
          verified: false,
          onboardingComplete: true,
        },
      });

      try {
        await sendTutorDecisionEmail({
          to: profile.user.email,
          tutorName,
          approved: false,
        });
      } catch (emailError) {
        console.error("Tutor decision email failed:", emailError);
      }

      return NextResponse.json({ success: true, verificationStatus: "REJECTED" });
    }

    if (
      !canSubadminReview({
        status: profile.verificationStatus,
        recommendations: profile.recommendations,
      })
    ) {
      return NextResponse.json(
        { error: "This application is not ready for review" },
        { status: 400 }
      );
    }

    const existingReview = profile.subadminReviews.find(
      (review) => review.reviewerId === session.user.id
    );
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this tutor" },
        { status: 409 }
      );
    }

    const validCheckedItems = (checkedItems ?? []).filter((item) =>
      TUTOR_VERIFICATION_CHECKLIST_IDS.includes(
        item as (typeof TUTOR_VERIFICATION_CHECKLIST_IDS)[number]
      )
    );

    if (validCheckedItems.length === 0) {
      return NextResponse.json(
        { error: "Select at least one verification checklist item" },
        { status: 400 }
      );
    }

    const reviewerName = session.user.name ?? "Sub-admin";

    await prisma.$transaction([
      prisma.tutorSubadminReview.create({
        data: {
          tutorProfileId: id,
          reviewerId: session.user.id,
          reviewerName,
          checkedItems: validCheckedItems,
        },
      }),
      prisma.tutorProfile.update({
        where: { id },
        data: {
          verificationStatus: "AWAITING_SUPERADMIN",
          onboardingComplete: true,
        },
      }),
    ]);

    try {
      const superadmins = await prisma.user.findMany({
        where: { role: "ADMIN", adminTier: "SUPERADMIN" },
        select: { email: true },
      });
      await notifySuperadminsOfTutorRecommendation({
        tutorName,
        tutorEmail: profile.user.email,
        reviewerName,
        checkedItems: validCheckedItems,
        superadminEmails: superadmins.map((admin) => admin.email),
      });
    } catch (emailError) {
      console.error("Superadmin recommendation email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      verificationStatus: "AWAITING_SUPERADMIN",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Admin verification action error:", error);
    return NextResponse.json({ error: "Could not update tutor" }, { status: 500 });
  }
}
