import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  { title: "Monthly Revenue Report", date: "May 2026", type: "Financial" },
  { title: "User Growth Report", date: "Q1 2026", type: "Analytics" },
  { title: "Session Completion Report", date: "April 2026", type: "Operations" },
  { title: "Tutor Performance Report", date: "May 2026", type: "Quality" },
];

export default function AdminReportsPage() {
  return (
    <>
      <DashboardHeader title="Reports" subtitle="Generate and download platform reports" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.title}>
              <CardHeader>
                <CardTitle className="text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{r.date}</p>
                  <p className="text-xs text-primary">{r.type}</p>
                </div>
                <button className="text-sm font-medium text-primary hover:underline">
                  Download
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
