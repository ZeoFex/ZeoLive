import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DashboardHeader title="Payments" subtitle="Manage subscriptions and billing" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-none lg:col-span-1">
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{plusPlan?.name}</p>
              <p className="text-muted-foreground">
                {formatCurrency(plusPlan?.price ?? 0)}/month
              </p>
              <Button className="mt-4 w-full" variant="outline">
                Manage subscription
              </Button>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Payment methods</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="min-w-[240px] rounded-lg border bg-muted/40 p-5">
                <p className="text-xs text-muted-foreground">Visa</p>
                <p className="mt-2 font-mono text-sm">•••• 4242</p>
                <p className="mt-3 text-xs text-muted-foreground">Expires 12/28</p>
              </div>
              <Button variant="outline">Add payment method</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
