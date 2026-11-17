import { MotionTitle } from "@/components/landing/motion-card";

interface SectionHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={className}>
      <MotionTitle
        text={title}
        className="text-[1.65rem] font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl"
      />
      {description && (
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
