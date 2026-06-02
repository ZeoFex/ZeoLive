import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { studentRegistrationSchema } from "@/lib/validations/registration";
import { buildDisplayName, parseDateOfBirth } from "@/lib/user-name";
import type { SchoolType } from "@/generated/prisma";

export async function POST(request: Request) {
  try {
    const platform = await getPlatformSettings();
    if (!platform.allowStudentSignup) {
      return NextResponse.json(
        { error: "Student registration is currently disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = studentRegistrationSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const displayName = buildDisplayName(data);

    await prisma.user.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        name: displayName,
        email,
        phone: data.phone,
        country: data.country,
        regionState: data.regionState,
        dateOfBirth: parseDateOfBirth(data.dateOfBirth),
        termsAcceptedAt: new Date(),
        passwordHash,
        role: "STUDENT",
        studentProfile: {
          create: {
            schoolType: data.schoolType as SchoolType,
            schoolName:
              data.schoolType === "HOME_SCHOOL" ? null : data.schoolName ?? null,
            schoolRegionState:
              data.schoolType === "HOME_SCHOOL"
                ? null
                : data.schoolRegionState ?? null,
          },
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Student registration error:", error);
    return NextResponse.json(
      { error: "Could not create account" },
      { status: 500 }
    );
  }
}
