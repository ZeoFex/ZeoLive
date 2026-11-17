import type { CmsHeroCardItem } from "@/lib/cms-types";
import { cn } from "@/lib/utils";

export function ScheduleCard({
  title,
  items,
  footnote,
  className,
}: {
  title: string;
  items: CmsHeroCardItem[];
  footnote?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <aside
      className={cn(
        "w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm",
        className
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-3 space-y-3">
        {items.map((session, index) => (
          <li
            key={`${session.subject}-${session.tutor}-${index}`}
            className="border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <p className="text-sm font-semibold leading-snug text-primary">
              {session.subject}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-foreground">
              {session.tutor}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{session.time}</p>
          </li>
        ))}
      </ul>
      {footnote ? <p className="mt-3 text-xs text-muted-foreground">{footnote}</p> : null}
    </aside>
  );
}
