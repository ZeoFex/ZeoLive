import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppBaseUrlFromRequest } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { createPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

const GENERIC_MESSAGE =
  "If an account exists for that email, you will receive reset instructions.";

/** Request a password reset link (Auth.js VerificationToken + SMTP). */
export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const normalized = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    if (user?.passwordHash) {
      const { rawToken, hashedToken, expires } = createPasswordResetToken();

      await prisma.verificationToken.deleteMany({
        where: { identifier: normalized },
      });
      await prisma.verificationToken.create({
        data: {
          identifier: normalized,
          token: hashedToken,
          expires,
        },
      });

      try {
        await sendPasswordResetEmail({
          to: normalized,
          rawToken,
          baseUrl: getAppBaseUrlFromRequest(request),
        });
      } catch (mailError) {
        console.error("[forgot-password] Email send failed:", mailError);
        await prisma.verificationToken.deleteMany({
          where: { identifier: normalized, token: hashedToken },
        });
        const hint =
          process.env.NODE_ENV === "development" &&
          mailError instanceof Error &&
          mailError.message
            ? ` (${mailError.message})`
            : "";
        return NextResponse.json(
          {
            error: `Could not send reset email. Check SMTP settings and try again.${hint}`,
          },
          { status: 503 }
        );
      }

      if (process.env.NODE_ENV === "development") {
        const { resetPasswordUrl } = await import("@/lib/app-url");
        console.info(
          `[dev] Password reset link for ${normalized}: ${resetPasswordUrl(rawToken, getAppBaseUrlFromRequest(request))}`
        );
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
