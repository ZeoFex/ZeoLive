import Image from "next/image";
import Link from "next/link";

interface AuthBrandPanelProps {
  headline?: string;
  highlightWord?: string;
}

export function AuthBrandPanel({
  headline = "Simplify Learning And Live Tutoring",
  highlightWord = "Live Tutoring",
}: AuthBrandPanelProps) {
  const parts = headline.split(highlightWord);

  return (
    <aside className="auth-brand-panel relative hidden w-full max-w-[50%] flex-col overflow-hidden lg:flex">
      <div className="auth-brand-waves pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col p-10 xl:p-12">
        <Link href="/" className="inline-flex w-fit">
          <Image
            src="/images/zoelive-logo.png"
            alt="ZoeLive"
            width={160}
            height={64}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        <div className="mt-auto space-y-6 pb-4">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-[#0B4F8A] xl:text-[2.75rem]">
            {parts[0]}
            <span className="relative inline-block whitespace-nowrap">
              {highlightWord}
              <svg
                className="pointer-events-none absolute -inset-x-2 -inset-y-1 text-[#F97316]"
                viewBox="0 0 200 60"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <ellipse
                  cx="100"
                  cy="30"
                  rx="96"
                  ry="26"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  transform="rotate(-3 100 30)"
                />
              </svg>
            </span>
            {parts[1] ?? ""}
          </h2>

          <div className="relative -mx-4 max-w-md xl:-mx-0">
            <Image
              src="/images/zoelive-logo.png"
              alt=""
              width={480}
              height={320}
              className="w-full object-contain drop-shadow-md"
              aria-hidden
            />
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-[#0B4F8A]/60">
          TECHNOLOGY · INNOVATION · IMPACT
        </p>
      </div>
    </aside>
  );
}
