import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { serializeUser } from "@/lib/admin/serializers";
import { buildDisplayName } from "@/lib/user-name";

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT", "TUTOR", "ADMIN"]),
  adminTier: z.enum(["SUBADMIN"]).optional(),
  phone: z.string().optional(),
});

export async function GET(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const role = searchParams.get("role");
  const adminTier = searchParams.get("adminTier");
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));

  const where = {
    ...(role && role !== "all"
      ? { role: role.toUpperCase() as "STUDENT" | "TUTOR" | "ADMIN" }
      : {}),
    ...(adminTier === "subadmin"
      ? { role: "ADMIN" as const, adminTier: "SUBADMIN" as const }
      : adminTier === "superadmin"
        ? { role: "ADMIN" as const, adminTier: "SUPERADMIN" as const }
        : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
      include: { tutorProfile: { select: { verificationStatus: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map(serializeUser),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);
    const email = data.email.toLowerCase();

    if (data.role === "ADMIN" && data.adminTier !== "SUBADMIN") {
      return NextResponse.json(
        { error: "Only sub-admin accounts can be created here. Super admin is set at initial setup." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const displayName = buildDisplayName({
      firstName: data.firstName,
      lastName: data.lastName,
    });

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: displayName,
        email,
        phone: data.phone ?? null,
        passwordHash: await hashPassword(data.password),
        role: data.role,
        adminTier: data.role === "ADMIN" ? "SUBADMIN" : null,
        termsAcceptedAt: new Date(),
        ...(data.role === "TUTOR"
          ? {
              tutorProfile: {
                create: {
                  verificationStatus: "PENDING",
                  onboardingComplete: false,
                  verified: false,
                },
              },
            }
          : {}),
        ...(data.role === "STUDENT"
          ? {
              studentProfile: {
                create: { schoolType: "PUBLIC_SCHOOL" },
              },
            }
          : {}),
      },
      include: { tutorProfile: { select: { verificationStatus: true } } },
    });

    return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Could not create user" }, { status: 500 });
  }
}
