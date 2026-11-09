import Link from "next/link";
import { BRAND_FULL_NAME, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "full" | "mark" | "wordmark" | "stacked";

interface LogoProps {
  href?: string | null;
  size?: LogoSize;
  variant?: LogoVariant;
  inverted?: boolean;
  className?: string;
  markClassName?: string;
  priority?: boolean;
}

const sizeConfig = {
  sm: {
    mark: "h-10 w-10 rounded-[0.8rem]",
    markText: "text-[0.8rem] tracking-[0.06em]",
    word: "text-lg",
    gap: "gap-2.5",
  },
  md: {
    mark: "h-11 w-11 rounded-[0.9rem]",
    markText: "text-[0.88rem] tracking-[0.07em]",
    word: "text-xl",
    gap: "gap-3",
  },
  lg: {
    mark: "h-14 w-14 rounded-[1.05rem]",
    markText: "text-[1.05rem] tracking-[0.08em]",
    word: "text-2xl",
    gap: "gap-3.5",
  },
  xl: {
    mark: "h-16 w-16 rounded-2xl",
    markText: "text-base tracking-[0.08em]",
    word: "text-3xl",
    gap: "gap-3.5",
  },
} as const;

function LogoMark({
  size,
  className,
}: {
  size: LogoSize;
  className?: string;
}) {
  const config = sizeConfig[size];

  return (
    <span
      className={cn(
        "ztl-logo-mark relative inline-flex shrink-0 items-center justify-center overflow-hidden shadow-[0_10px_24px_-12px_rgba(0,102,204,0.6)] ring-1 ring-white/25",
        config.mark,
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 bg-[linear-gradient(145deg,#19b7f5_0%,#0066cc_48%,#004f9a_100%)]" />
      <span className="absolute inset-[1px] rounded-[inherit] bg-[linear-gradient(160deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_42%)]" />
      <span className="absolute -bottom-3 -right-2 h-8 w-8 rounded-full bg-[#00aeef]/40 blur-md" />
      <span
        className={cn(
          "relative font-extrabold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,40,90,0.25)]",
          config.markText
        )}
      >
        ZTL
      </span>
    </span>
  );
}

function LogoWordmark({
  size,
  stacked = false,
  inverted = false,
}: {
  size: LogoSize;
  stacked?: boolean;
  inverted?: boolean;
}) {
  const config = sizeConfig[size];

  return (
    <span
      className={cn(
        "min-w-0",
        stacked ? "flex flex-col items-start" : "flex flex-col justify-center"
      )}
    >
      <span
        className={cn(
          "font-extrabold leading-none tracking-tight",
          inverted
            ? "text-white"
            : "text-slate-900 dark:text-slate-50",
          config.word
        )}
      >
        {BRAND_NAME}
      </span>
    </span>
  );
}

export function Logo({
  href = "/",
  size = "md",
  variant = "full",
  inverted = false,
  className,
  markClassName,
}: LogoProps) {
  const config = sizeConfig[size];
  const label = `${BRAND_NAME} — ${BRAND_FULL_NAME}`;

  const content =
    variant === "mark" ? (
      <LogoMark size={size} className={markClassName} />
    ) : variant === "wordmark" ? (
      <LogoWordmark size={size} inverted={inverted} />
    ) : variant === "stacked" ? (
      <span className={cn("flex flex-col items-start", config.gap)}>
        <LogoMark size={size} className={markClassName} />
        <LogoWordmark size={size} stacked inverted={inverted} />
      </span>
    ) : (
      <span className={cn("inline-flex items-center", config.gap)}>
        <LogoMark size={size} className={markClassName} />
        <LogoWordmark size={size} inverted={inverted} />
      </span>
    );

  const classes = cn(
    "ztl-logo inline-flex items-center transition-opacity hover:opacity-90",
    className
  );

  if (href === null) {
    return (
      <span className={classes} aria-label={label}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={label}>
      {content}
    </Link>
  );
}

/** Large decorative mark for auth / marketing surfaces. */
export function LogoHero({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-md flex-col items-center justify-center py-4",
        className
      )}
    >
      <div className="relative">
        <div
          className="absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(0,174,239,0.18),transparent_70%)]"
          aria-hidden
        />
        <div className="ztl-logo-mark relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] shadow-[0_24px_48px_-20px_rgba(0,84,166,0.55)] sm:h-44 sm:w-44 sm:rounded-[2.25rem]">
          <span className="absolute inset-0 bg-[linear-gradient(145deg,#19b7f5_0%,#0066cc_48%,#004f9a_100%)]" />
          <span className="absolute inset-[1.5px] rounded-[inherit] bg-[linear-gradient(160deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0)_45%)]" />
          <span className="absolute -left-6 top-4 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
          <span className="absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-[#003d7a]/40 blur-2xl" />
          <svg
            viewBox="0 0 120 120"
            className="relative h-[72%] w-[72%]"
            aria-hidden
          >
            <defs>
              <linearGradient id="ztlHeroShine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#e8f7ff" stopOpacity="0.92" />
              </linearGradient>
            </defs>
            <text
              x="60"
              y="72"
              textAnchor="middle"
              fill="url(#ztlHeroShine)"
              fontSize="38"
              fontWeight="800"
              letterSpacing="2.5"
              fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            >
              ZTL
            </text>
          </svg>
        </div>
      </div>

      <div className="relative mt-6 text-center">
        <p className="text-2xl font-bold tracking-tight text-[#0B4F8A] sm:text-3xl">
          {BRAND_NAME}
        </p>
        <p className="mt-1.5 text-sm font-medium tracking-[0.12em] text-[#0B4F8A]/70 uppercase">
          {BRAND_FULL_NAME}
        </p>
      </div>
    </div>
  );
}
