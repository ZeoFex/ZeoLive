import type { ReactNode } from "react";
import { Video } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JoinMeetingPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const tutoring = await prisma.tutoringSession.findUnique({
    where: { roomId },
    select: { id: true, tutorId: true, studentId: true, status: true, title: true },
  });

  if (!tutoring) {
    return (
      <JoinNotice
        title="This meeting link is not valid"
        body="Ask your tutor to send a new link."
      />
    );
  }

  if (tutoring.status === "CANCELLED" || tutoring.status === "COMPLETED") {
    return (
      <JoinNotice
        title="This meeting has ended"
        body={tutoring.title ? `"${tutoring.title}" is no longer open.` : "This meeting is no longer open."}
      />
    );
  }

  const session = await auth();
  const callback = `/join/${roomId}`;
  const callbackQuery = `callbackUrl=${encodeURIComponent(callback)}`;

  if (!session?.user?.id || !session.user.role) {
    return (
      <JoinNotice
        title="Join this meeting"
        meetingTitle={tutoring.title?.trim() || undefined}
        body="Create a student account if you are new. After that you go straight into the meeting. If you already have an account, sign in and join."
      >
        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-[#0066CC] text-white hover:bg-[#0054a6]"
          >
            <Link href={`/signup/student?${callbackQuery}`}>Create account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 w-full rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          >
            <Link href={`/login?${callbackQuery}`}>Sign in</Link>
          </Button>
        </div>
      </JoinNotice>
    );
  }

  const isHost = session.user.id === tutoring.tutorId || session.user.role === "ADMIN";
  if (!isHost) {
    if (session.user.role !== "STUDENT") {
      return (
        <JoinNotice
          title="Use a student account"
          body="Sign out, then create a student account or sign in as a student to join this meeting."
        >
          <Button variant="outline" asChild>
            <Link href={`/login?${callbackQuery}`}>Sign in</Link>
          </Button>
        </JoinNotice>
      );
    }

    await prisma.sessionParticipant.upsert({
      where: {
        tutoringSessionId_studentId: {
          tutoringSessionId: tutoring.id,
          studentId: session.user.id,
        },
      },
      create: {
        tutoringSessionId: tutoring.id,
        studentId: session.user.id,
      },
      update: {},
    });

    if (tutoring.studentId === tutoring.tutorId) {
      await prisma.tutoringSession.update({
        where: { id: tutoring.id },
        data: { studentId: session.user.id },
      });
    }
  }

  redirect(`/classroom/${roomId}`);
}

function JoinNotice({
  title,
  meetingTitle,
  body,
  children,
}: {
  title: string;
  meetingTitle?: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F8FC]">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#00aeef]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#0066CC]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12">
        <div className="flex items-center gap-3">
          <Logo href="/" size="lg" variant="mark" />
          <span className="text-2xl font-extrabold tracking-tight text-[#0B4F8A]">ZTL</span>
        </div>

        <div className="mt-8 w-full rounded-[28px] border border-white bg-white px-6 py-8 text-center shadow-[0_24px_60px_-28px_rgba(0,84,166,0.45)] sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#19b7f5_0%,#0066cc_52%,#004f9a_100%)] text-white shadow-[0_16px_30px_-16px_rgba(0,102,204,0.8)]">
            <Video className="h-8 w-8" strokeWidth={1.75} />
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0066CC]">
            Live classroom
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {meetingTitle ? (
            <p className="mt-2 text-base font-semibold text-[#0B4F8A]">{meetingTitle}</p>
          ) : null}
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{body}</p>

          <div className="mt-6">
            {children ?? (
              <Button asChild className="h-11 w-full rounded-xl bg-[#0066CC] hover:bg-[#0054a6]">
                <Link href="/">Back home</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
