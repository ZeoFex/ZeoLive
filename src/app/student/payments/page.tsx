import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { payments, pricingPlans } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant = {
  completed: "success" as const,
  pending: "warning" as const,
  failed: "destructive" as const,
  refunded: "secondary" as const,
};

export default function StudentPaymentsPage() {
  const plusPlan = pricingPlans.find((p) => p.id === "plus");

  return (
    <>
      <StudentPageHeader
        title="Billing & plans"
        description="Manage your subscription and payment history."
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="student-card p-5 lg:col-span-1">
          <h3 className="font-bold text-slate-900">Current plan</h3>
          <p className="mt-3 text-2xl font-bold text-slate-900">{plusPlan?.name}</p>
          <p className="text-slate-500">
            {formatCurrency(plusPlan?.price ?? 0)}
            <span className="text-sm">/month</span>
          </p>
          <Button className="student-outline-btn mt-4 w-full rounded-xl" variant="outline">
            Change plan
          </Button>
        </div>

        <div className="student-table-wrap lg:col-span-2">
          <div className="border-b border-slate-100 px-4 py-3 sm:hidden">
            <h3 className="font-bold text-slate-900">Payment history</h3>
          </div>
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 p-4 sm:hidden">
            {payments.map((p) => (
              <div key={p.id} className="student-session-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{p.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(p.date)}</p>
                  </div>
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </div>
                <p className="mt-2 font-bold text-slate-900">{formatCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
