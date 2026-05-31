import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TUTOR_EDUCATION_LEVELS } from "@/lib/constants/registration";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: "default" | "tutor" | "student";
}

export function AuthLayout({
  children,
  title,
  subtitle,
  variant = "default",
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          "hidden flex-1 flex-col justify-between p-10 lg:flex lg:max-w-md xl:max-w-lg",
          variant === "tutor"
            ? "bg-gradient-to-br from-primary via-primary/90 to-slate-800 text-primary-foreground"
            : "border-r bg-muted/50"
        )}
      >
        <Link
          href="/"
          className={cn(
            "text-base font-semibold",
            variant === "tutor" && "text-primary-foreground"
          )}
        >
          ZoeLive
        </Link>

        <div className="space-y-4">
          {variant === "tutor" ? (
            <>
              <p className="text-sm leading-relaxed opacity-90">
                Tutors are verified by education level before teaching on the
                platform.
              </p>
              <ul className="space-y-2 text-sm opacity-90">
                {TUTOR_EDUCATION_LEVELS.map((level) => (
                  <li key={level.value} className="border-l-2 border-white/40 pl-3">
                    <span className="font-medium">{level.label}</span>
                    <p className="mt-0.5 text-xs opacity-80">{level.description}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Students book verified tutors for live online sessions. Tutors complete
              a separate application with document verification.
            </p>
          )}
        </div>

        <p
          className={cn(
            "text-xs",
            variant === "tutor" ? "opacity-70" : "text-muted-foreground"
          )}
        >
          © ZoeLive
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="text-base font-semibold lg:hidden">
            ZoeLive
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
