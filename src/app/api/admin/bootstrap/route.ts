import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { buildDisplayName } from "@/lib/user-name";

const bootstrapSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

/** Create the first admin when none exist (one-time setup). */
export async function POST(request: Request) {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return NextResponse.json(
      { error: "An admin account already exists. Sign in or ask an admin to create users." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = bootstrapSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: buildDisplayName(data),
        email,
        passwordHash: await hashPassword(data.password),
        role: "ADMIN",
        adminTier: "SUPERADMIN",
        termsAcceptedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, userId: user.id, message: "Super admin created. You can now sign in." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Admin bootstrap error:", error);
    return NextResponse.json({ error: "Could not create admin" }, { status: 500 });
  }
}

export async function GET() {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return NextResponse.json({ needsBootstrap: adminCount === 0 });
}
