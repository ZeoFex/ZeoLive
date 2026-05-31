"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ChartContainer } from "@/components/shared/chart-container";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { Button } from "@/components/ui/button";
import { earningsData, payments } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TutorEarningsPage() {
  return (
    <>
      <TutorPageHeader
        title="Earnings"
        description="Track revenue, withdrawals, and transaction history."
        actions={
          <Button
            className="tutor-gradient-btn rounded-xl"
            onClick={() => toast.success("Withdrawal initiated")}
          >
            Withdraw funds
          </Button>
        }
      />

      <div className="tutor-stat-card mb-6 max-w-sm">
        <p className="text-sm font-medium text-slate-500">Available balance</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
          {formatCurrency(1840)}
        </p>
      </div>

      <div className="tutor-card p-5 sm:p-6">
        <h3 className="mb-4 text-base font-bold text-slate-900">Revenue overview</h3>
        <ChartContainer height={300}>
          <BarChart data={earningsData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="earnings" fill="#6366f1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="tutor-table-wrap mt-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Transaction history</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 4).map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.date)}</td>
                <td>{p.description}</td>
                <td className="font-medium text-emerald-600">+{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
