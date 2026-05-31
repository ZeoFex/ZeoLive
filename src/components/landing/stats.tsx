import { platformStats } from "@/lib/mock-data";

const stats = [
  { label: "Tutors on the platform", value: platformStats.tutors.toLocaleString() },
  { label: "Registered students", value: platformStats.students.toLocaleString() },
  { label: "Sessions this week", value: platformStats.liveSessions.toLocaleString() },
  { label: "Sessions completed on time", value: `${platformStats.successRate}%` },
];

export function Stats() {
  return (
    <section className="border-b bg-muted/50 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
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
