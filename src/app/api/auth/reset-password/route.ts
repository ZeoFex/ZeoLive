import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1, "Reset link is invalid or expired"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/** Set a new password using a reset token from email. */
export async function POST(request: Request) {
  try {
    const { token, password } = schema.parse(await request.json());
    const hashedToken = hashPasswordResetToken(token);

    const record = await prisma.verificationToken.findFirst({
      where: { token: hashedToken, expires: { gt: new Date() } },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: record.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: record.identifier,
            token: record.token,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

/** Validate reset token without changing password (optional pre-check for UI). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const hashedToken = hashPasswordResetToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashedToken, expires: { gt: new Date() } },
  });

  return NextResponse.json({ valid: !!record });
}
