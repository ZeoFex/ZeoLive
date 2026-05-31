import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TutorPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function TutorPageHeader({
  title,
  description,
  actions,
  className,
}: TutorPageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
