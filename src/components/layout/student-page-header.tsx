import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StudentPageHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function StudentPageHeader({
  title,
  description,
  actions,
  className,
}: StudentPageHeaderProps) {
  if (!title && !description && !actions) return null;

  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {title && (
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
        )}
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      )}
    </div>
  );
}
