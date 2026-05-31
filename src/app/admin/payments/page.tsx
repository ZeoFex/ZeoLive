"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
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
      <AdminPageHeader
        title="Payment manager"
        description="Review and monitor platform transactions."
        actions={
          <Button
            variant="outline"
            className="admin-outline-btn rounded-xl"
            onClick={() => toast.success("Export started (mock)")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="admin-table-wrap">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
                <TableCell className="font-mono text-xs text-slate-500">{p.id}</TableCell>
                <TableCell>{formatDate(p.date)}</TableCell>
                <TableCell className="font-medium text-slate-900">{p.description}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
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
