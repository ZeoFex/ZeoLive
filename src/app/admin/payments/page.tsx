"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
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
import { payments } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant = {
  completed: "success" as const,
  pending: "warning" as const,
  failed: "destructive" as const,
  refunded: "secondary" as const,
};

export default function AdminPaymentsPage() {
  return (
    <>
      <DashboardHeader title="Payments" subtitle="Monitor platform transactions" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => toast.success("Export started (mock)")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell>{formatDate(p.date)}</TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell>{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
