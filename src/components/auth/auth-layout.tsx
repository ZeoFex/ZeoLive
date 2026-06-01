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
}

export function AuthLayout({
  children,
  title,
  subtitle,
  footer,
  headline,
  highlightWord,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell flex min-h-screen bg-white">
      <AuthBrandPanel headline={headline} highlightWord={highlightWord} />

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 lg:hidden">
          <Link href="/" className="inline-flex">
            <Image
              src="/images/zoelive-logo.png"
              alt="Zeolive"
              width={140}
              height={56}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>

        {footer && (
          <div className="border-t border-slate-100 px-6 py-4 text-center text-sm lg:px-16">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
