import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StudentStatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: StudentStatCardProps) {
  return (
    <div className={cn("student-stat-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
          {trend && <p className="mt-1 text-xs text-emerald-600">{trend}</p>}
        </div>
        <div className="student-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
