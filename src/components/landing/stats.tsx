import type { CmsStats } from "@/lib/cms-types";

export function Stats({ stats }: { stats: CmsStats }) {
  const items = [
    { label: "Tutors on the platform", value: stats.tutors.toLocaleString() },
    { label: "Registered students", value: stats.students.toLocaleString() },
    { label: "Sessions on the platform", value: stats.liveSessions.toLocaleString() },
    { label: "Sessions completed on time", value: `${stats.successRate}%` },
  ];

  return (
    <section className="border-b bg-muted/50 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
