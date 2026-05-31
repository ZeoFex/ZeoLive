import { Download } from "lucide-react";
import { AdminPageHeader } from "@/components/layout/admin-page-header";

const reports = [
  { title: "Monthly Revenue Report", date: "May 2026", type: "Financial" },
  { title: "User Growth Report", date: "Q1 2026", type: "Analytics" },
  { title: "Session Completion Report", date: "April 2026", type: "Operations" },
  { title: "Tutor Performance Report", date: "May 2026", type: "Quality" },
];

const typeTag: Record<string, string> = {
  Financial: "admin-tag-violet",
  Analytics: "admin-tag-emerald",
  Operations: "admin-tag-amber",
  Quality: "admin-tag-slate",
};

export default function AdminReportsPage() {
  return (
    <>
      <AdminPageHeader
        title="Analytics & reports"
        description="Generate and download platform performance reports."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <div key={r.title} className="admin-report-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`admin-tag ${typeTag[r.type] ?? "admin-tag-slate"}`}>
                  {r.type}
                </span>
                <h3 className="mt-3 text-base font-bold text-slate-900">{r.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{r.date}</p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                aria-label={`Download ${r.title}`}
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-violet-600 hover:underline"
            >
              Download report
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
