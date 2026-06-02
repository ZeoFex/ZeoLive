import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { tutorRegistrationSchema } from "@/lib/validations/registration";
import { sendTutorAccountEmail } from "@/lib/email/tutor";
import { buildDisplayName, parseDateOfBirth } from "@/lib/user-name";

export async function POST(request: Request) {
  try {
    const platform = await getPlatformSettings();
    if (!platform.allowTutorSignup) {
      return NextResponse.json(
        { error: "Tutor applications are currently disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = tutorRegistrationSchema.parse(body);
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
        role: "TUTOR",
        tutorProfile: {
          create: {
            onboardingComplete: false,
            verificationStatus: "PENDING",
            verified: false,
          },
        },
      },
    });

    try {
      await sendTutorAccountEmail({ to: email, tutorName: displayName });
    } catch (emailError) {
      console.error("Tutor welcome email failed:", emailError);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Tutor registration error:", error);
    return NextResponse.json(
      { error: "Could not create account" },
      { status: 500 }
    );
  }
}
