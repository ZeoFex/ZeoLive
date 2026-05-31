import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildDisplayName } from "@/lib/user-name";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TUTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      name: true,
      email: true,
      tutorProfile: {
        select: { institutionName: true, verificationStatus: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fullName =
    user.name ??
    buildDisplayName({
      firstName: user.firstName ?? "",
      middleName: user.middleName,
      lastName: user.lastName ?? "",
    });

  return NextResponse.json({
    fullName,
    institutionName: user.tutorProfile?.institutionName ?? null,
    verificationStatus: user.tutorProfile?.verificationStatus ?? "PENDING",
  });
}
