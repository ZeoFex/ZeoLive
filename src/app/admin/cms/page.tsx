"use client";

import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCmsPage() {
  return (
    <>
      <DashboardHeader title="CMS" subtitle="Manage landing page content" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Hero section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input defaultValue="Learn live with verified tutors" className="mt-1.5" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea
                defaultValue="Connect with expert tutors for personalized live sessions."
                className="mt-1.5"
              />
            </div>
            <Button onClick={() => toast.success("Content published (mock)")}>
              Publish changes
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Platform stats</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tutors count</Label>
              <Input defaultValue="2840" className="mt-1.5" />
            </div>
            <div>
              <Label>Students count</Label>
              <Input defaultValue="12500" className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
