import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";
import { routes } from "@/lib/routes";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { adminTier } = authResult;
  const superAdmin = isSuperAdmin(adminTier);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: {
    id: string;
    type: "user" | "tutor_application";
    title: string;
    subtitle: string;
    href: string;
  }[] = [];

  if (superAdmin) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        name: true,
        role: true,
      },
    });

    for (const user of users) {
      const name =
        user.name ??
        buildDisplayName({
          firstName: user.firstName ?? "",
          middleName: user.middleName,
          lastName: user.lastName ?? "",
        });
      results.push({
        id: `user-${user.id}`,
        type: "user",
        title: name,
        subtitle: `${user.role.toLowerCase()} · ${user.email}`,
        href: `/admin/users?search=${encodeURIComponent(user.email)}`,
      });
    }
  }

  const tutorProfiles = await prisma.tutorProfile.findMany({
    where: {
      OR: [
        { institutionName: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { firstName: { contains: q, mode: "insensitive" } } },
        { user: { lastName: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          name: true,
        },
      },
    },
  });

  for (const profile of tutorProfiles) {
    const name =
      profile.user.name ??
      buildDisplayName({
        firstName: profile.user.firstName ?? "",
        middleName: profile.user.middleName,
        lastName: profile.user.lastName ?? "",
      });

    const statusFilter =
      profile.verificationStatus === "AWAITING_SUPERADMIN"
        ? "awaiting_final"
        : profile.verificationStatus === "APPROVED"
          ? "approved"
          : profile.verificationStatus === "REJECTED"
            ? "rejected"
            : "pending";

    results.push({
      id: `tutor-${profile.id}`,
      type: "tutor_application",
      title: name,
      subtitle: `Tutor · ${profile.verificationStatus.replace(/_/g, " ").toLowerCase()}`,
      href: `${routes.admin.verification}?status=${statusFilter}`,
    });
  }

  return NextResponse.json({ results: results.slice(0, 8) });
}
