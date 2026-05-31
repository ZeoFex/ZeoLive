"use client";

import { FileText, Trash2 } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const materials = [
  { id: "1", name: "Calculus II — Integration Notes.pdf", size: "2.4 MB", date: "May 18" },
  { id: "2", name: "Practice Problems Set 4.pdf", size: "1.1 MB", date: "May 15" },
  { id: "3", name: "Algebra Cheat Sheet.pdf", size: "890 KB", date: "May 10" },
];

export default function TutorMaterialsPage() {
  return (
    <>
      <DashboardHeader title="Materials" subtitle="Upload and share learning resources" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <FileUpload label="Upload new material" accept=".pdf,.doc,.docx,image/*" className="mb-8" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <Card key={m.id} className="group">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.size} · {m.date}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
