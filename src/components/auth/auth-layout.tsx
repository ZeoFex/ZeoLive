import Link from "next/link";
import Image from "next/image";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  headline?: string;
  highlightWord?: string;
  /** Tighter spacing + wider form column (tutor registration). */
  compact?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  footer,
  headline,
  highlightWord,
  compact = false,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell flex min-h-screen bg-white">
      <AuthBrandPanel headline={headline} highlightWord={highlightWord} />

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3 lg:hidden">
          <Link href="/" className="inline-flex">
            <Image
              src="/images/zoelive-logo.png"
              alt="Zeolive"
              width={140}
              height={56}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <div
          className={
            compact
              ? "flex flex-1 items-start justify-center px-5 py-6 sm:px-8 lg:items-center lg:px-12 xl:px-16"
              : "flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20"
          }
        >
          <div className={compact ? "w-full max-w-xl" : "w-full max-w-md"}>
            <h1
              className={
                compact
                  ? "text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]"
                  : "text-3xl font-bold tracking-tight text-slate-900"
              }
            >
              {title}
            </h1>
            <p
              className={
                compact
                  ? "mt-1.5 text-sm leading-snug text-slate-500"
                  : "mt-2 text-sm leading-relaxed text-slate-500"
              }
            >
              {subtitle}
            </p>
            <div className={compact ? "mt-5" : "mt-8"}>{children}</div>
          </div>
        </div>

        {footer && (
          <div
            className={
              compact
                ? "border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500 lg:px-12"
                : "border-t border-slate-100 px-6 py-4 text-center text-sm lg:px-16"
            }
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
