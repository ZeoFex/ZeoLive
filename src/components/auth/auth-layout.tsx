import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Logo } from "@/components/brand/logo";

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
    <div className="auth-shell flex min-h-screen bg-[#F3F8FC] lg:bg-white">
      <AuthBrandPanel headline={headline} highlightWord={highlightWord} />

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <div
          className={
            compact
              ? "flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16"
              : "flex flex-1 items-center justify-center px-4 py-8 sm:px-10 lg:px-16 xl:px-20"
          }
        >
          <div
            className={
              compact
                ? "w-full max-w-xl rounded-3xl border border-white/80 bg-white px-5 pb-6 pt-7 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] sm:px-8 sm:pb-8 sm:pt-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                : "w-full max-w-md rounded-3xl border border-white/80 bg-white px-5 pb-6 pt-7 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] sm:px-8 sm:pb-8 sm:pt-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
            }
          >
            <div className="mb-6 flex justify-center lg:mb-0 lg:hidden">
              <Logo href="/" size="md" className="justify-center" />
            </div>

            <h1
              className={
                compact
                  ? "text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem] lg:text-left"
                  : "text-center text-3xl font-bold tracking-tight text-slate-900 lg:text-left"
              }
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={
                  compact
                    ? "mt-1.5 text-center text-sm leading-snug text-slate-500 lg:text-left"
                    : "mt-2 text-center text-sm leading-relaxed text-slate-500 lg:text-left"
                }
              >
                {subtitle}
              </p>
            ) : null}
            <div className={compact ? "mt-5" : "mt-8"}>{children}</div>

            {footer ? (
              <div
                className={
                  compact
                    ? "mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 lg:mt-0 lg:border-0 lg:pt-0"
                    : "mt-5 border-t border-slate-100 pt-4 text-center text-sm lg:mt-0 lg:border-0 lg:pt-0"
                }
              >
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
